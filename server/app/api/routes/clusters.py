from typing import List, Optional
from datetime import datetime
import json
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from server.app.database.session import get_db
from server.app.models.user import User, UserRole
from server.app.models.complaint import Complaint
from server.app.models.cluster import ComplaintCluster, ClusterMembership, ClusterStatus
from server.app.models.audit import AuditLog
from server.app.schemas.cluster import (
    ClusterResponse, ClusterDetailResponse, ClusterConfirmRequest,
    ClusterMergeRequest, ClusterMemberMoveRequest, ClusterMemberResponse
)
from server.app.api.deps import get_current_user, require_roles
from server.app.ml.clustering import clustering_engine

router = APIRouter(prefix="/clusters", tags=["Recurring Issue Clusters"])

@router.get("", response_model=List[ClusterResponse])
def list_clusters(
    status: Optional[str] = None,
    category: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List recurring civic issue clusters with filtering by status and category."""
    query = db.query(ComplaintCluster)
    if status:
        query = query.filter(ComplaintCluster.status == status)
    if category:
        query = query.filter(ComplaintCluster.category == category)
    clusters = query.order_by(desc(ComplaintCluster.priority_score), desc(ComplaintCluster.complaint_count)).all()
    return [ClusterResponse.model_validate(c) for c in clusters]

@router.get("/{cluster_id}", response_model=ClusterDetailResponse)
def get_cluster_detail(
    cluster_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve candidate cluster detail, summary, centroid coordinates, and member complaints."""
    cluster = db.query(ComplaintCluster).filter(ComplaintCluster.id == cluster_id).first()
    if not cluster:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cluster not found")

    memberships = db.query(ClusterMembership).filter(
        ClusterMembership.cluster_id == cluster_id,
        ClusterMembership.removed_at.is_(None)
    ).all()

    member_responses = []
    for m in memberships:
        c = db.query(Complaint).filter(Complaint.id == m.complaint_id).first()
        member_responses.append(
            ClusterMemberResponse(
                id=m.id,
                complaint_id=m.complaint_id,
                similarity_to_centroid=m.similarity_to_centroid,
                is_manually_assigned=m.is_manually_assigned,
                added_at=m.added_at,
                complaint_reference=c.reference_no if c else None,
                complaint_title=c.title if c else None,
                complaint_status=c.status.value if c else None
            )
        )

    res = ClusterDetailResponse.model_validate(cluster)
    res.members = member_responses
    return res

@router.post("/{cluster_id}/confirm", response_model=ClusterResponse)
def confirm_or_reject_cluster(
    cluster_id: int,
    confirm_in: ClusterConfirmRequest,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.OFFICER])),
    db: Session = Depends(get_db)
):
    """Administrative action: confirm, reject, or mark a recurring issue cluster as resolved."""
    cluster = db.query(ComplaintCluster).filter(ComplaintCluster.id == cluster_id).first()
    if not cluster:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cluster not found")

    action = confirm_in.action.lower()
    if action == "confirm":
        cluster.status = ClusterStatus.CONFIRMED
        cluster.is_human_verified = True
        cluster.verified_by_id = current_user.id
        cluster.verified_at = datetime.utcnow()
    elif action == "reject":
        cluster.status = ClusterStatus.REJECTED
        cluster.is_human_verified = True
        cluster.verified_by_id = current_user.id
        cluster.verified_at = datetime.utcnow()
        # Unlink member complaints
        db.query(Complaint).filter(Complaint.cluster_id == cluster.id).update({"cluster_id": None})
    elif action == "resolve":
        cluster.status = ClusterStatus.RESOLVED
        cluster.updated_at = datetime.utcnow()
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Action must be 'confirm', 'reject', or 'resolve'")

    # Audit log
    audit = AuditLog(
        entity_type="cluster",
        entity_id=cluster.id,
        action=f"cluster_{action}",
        performed_by_id=current_user.id,
        changes_json=json.dumps({"action": action, "notes": confirm_in.notes}),
        created_at=datetime.utcnow()
    )
    db.add(audit)

    db.commit()
    db.refresh(cluster)
    return ClusterResponse.model_validate(cluster)

@router.post("/{cluster_id}/merge", response_model=ClusterResponse)
def merge_clusters(
    cluster_id: int,
    merge_in: ClusterMergeRequest,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.OFFICER])),
    db: Session = Depends(get_db)
):
    """Merge source cluster (cluster_id) into target cluster."""
    source = db.query(ComplaintCluster).filter(ComplaintCluster.id == cluster_id).first()
    target = db.query(ComplaintCluster).filter(ComplaintCluster.id == merge_in.target_cluster_id).first()
    if not source or not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="One or both clusters not found")
    if source.id == target.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot merge a cluster into itself")

    # Move member complaints
    db.query(Complaint).filter(Complaint.cluster_id == source.id).update({"cluster_id": target.id})
    db.query(ClusterMembership).filter(ClusterMembership.cluster_id == source.id).update({"cluster_id": target.id})

    # Update target complaint count
    target.complaint_count += source.complaint_count
    target.updated_at = datetime.utcnow()

    # Mark source as rejected / merged
    source.status = ClusterStatus.REJECTED
    source.complaint_count = 0

    # Audit log
    audit = AuditLog(
        entity_type="cluster",
        entity_id=target.id,
        action="merge_clusters",
        performed_by_id=current_user.id,
        changes_json=json.dumps({"source_cluster_id": source.id, "reason": merge_in.reason}),
        created_at=datetime.utcnow()
    )
    db.add(audit)

    db.commit()
    db.refresh(target)
    return ClusterResponse.model_validate(target)

@router.post("/{cluster_id}/move-member", response_model=dict)
def move_cluster_member(
    cluster_id: int,
    move_in: ClusterMemberMoveRequest,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.OFFICER])),
    db: Session = Depends(get_db)
):
    """Move a complaint out of a cluster or transfer it to another cluster."""
    complaint = db.query(Complaint).filter(Complaint.id == move_in.complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")

    old_cluster = db.query(ComplaintCluster).filter(ComplaintCluster.id == cluster_id).first()

    # Mark membership removed
    membership = db.query(ClusterMembership).filter(
        ClusterMembership.cluster_id == cluster_id,
        ClusterMembership.complaint_id == complaint.id,
        ClusterMembership.removed_at.is_(None)
    ).first()
    if membership:
        membership.removed_at = datetime.utcnow()

    if old_cluster and old_cluster.complaint_count > 0:
        old_cluster.complaint_count -= 1

    # If moving to another cluster
    if move_in.target_cluster_id:
        target = db.query(ComplaintCluster).filter(ComplaintCluster.id == move_in.target_cluster_id).first()
        if not target:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target cluster not found")
        complaint.cluster_id = target.id
        new_membership = ClusterMembership(
            cluster_id=target.id,
            complaint_id=complaint.id,
            similarity_to_centroid=0.85,
            is_manually_assigned=True,
            added_at=datetime.utcnow()
        )
        db.add(new_membership)
        target.complaint_count += 1
    else:
        complaint.cluster_id = None

    db.commit()
    return {"message": "Complaint membership updated successfully", "complaint_id": complaint.id}

@router.post("/recompute", response_model=dict)
def recompute_clusters(
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Run incremental clustering across all active complaints."""
    all_complaints = db.query(Complaint).all()
    complaint_dicts = [
        {
            "id": c.id,
            "title": c.title,
            "description": c.description,
            "category": c.category,
            "locality": c.locality,
            "latitude": c.latitude,
            "longitude": c.longitude,
            "embedding": c.embedding,
            "created_at": c.created_at,
            "assigned_department_id": c.assigned_department_id
        }
        for c in all_complaints
    ]

    detected = clustering_engine.detect_clusters(complaint_dicts)
    new_clusters_created = 0

    for cluster_info in detected:
        # Check if already exists by representative complaint
        existing = db.query(ComplaintCluster).filter(
            ComplaintCluster.representative_complaint_id == cluster_info["representative_complaint_id"]
        ).first()

        if not existing:
            db_cluster = ComplaintCluster(
                cluster_code=cluster_info["cluster_code"],
                title=cluster_info["title"],
                category=cluster_info["category"],
                summary=cluster_info["summary"],
                representative_complaint_id=cluster_info["representative_complaint_id"],
                complaint_count=cluster_info["complaint_count"],
                first_reported_at=cluster_info["first_reported_at"],
                latest_reported_at=cluster_info["latest_reported_at"],
                centroid_lat=cluster_info["centroid_lat"],
                centroid_lon=cluster_info["centroid_lon"],
                spread_radius_meters=cluster_info["spread_radius_meters"],
                status=cluster_info["status"],
                priority_score=cluster_info["priority_score"],
                assigned_department_id=cluster_info["assigned_department_id"],
                is_human_verified=False,
                created_at=cluster_info["first_reported_at"],
                updated_at=cluster_info["latest_reported_at"]
            )
            db.add(db_cluster)
            db.flush()

            for m in cluster_info["members"]:
                db.add(ClusterMembership(
                    cluster_id=db_cluster.id,
                    complaint_id=m["complaint_id"],
                    similarity_to_centroid=m["similarity_to_centroid"],
                    added_at=datetime.utcnow()
                ))
                comp = db.query(Complaint).filter(Complaint.id == m["complaint_id"]).first()
                if comp:
                    comp.cluster_id = db_cluster.id

            new_clusters_created += 1

    db.commit()
    return {"message": f"Clustering recomputed. {new_clusters_created} new candidate clusters formed.", "total_candidates": len(detected)}
