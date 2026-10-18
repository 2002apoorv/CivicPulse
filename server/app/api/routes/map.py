from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from server.app.database.session import get_db
from server.app.models.complaint import Complaint
from server.app.models.cluster import ComplaintCluster
from server.app.models.user import User
from server.app.api.deps import get_current_user

router = APIRouter(prefix="/map", tags=["Geospatial Map"])

@router.get("/complaints", response_model=dict)
def get_map_complaints(
    category: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns only complaints that possess verified GPS coordinates.
    Strictly filters out records with null coordinates to avoid arbitrary map placements.
    """
    query = db.query(Complaint).filter(
        Complaint.latitude.isnot(None),
        Complaint.longitude.isnot(None),
        Complaint.has_verified_coordinates == True
    )

    if category:
        query = query.filter(Complaint.category == category)
    if status:
        query = query.filter(Complaint.status == status)
    if priority:
        query = query.filter(Complaint.priority == priority)

    complaints = query.all()

    points = [
        {
            "id": c.id,
            "reference_no": c.reference_no,
            "title": c.title,
            "category": c.category,
            "status": c.status.value,
            "priority": c.priority.value,
            "priority_score": c.priority_score,
            "locality": c.locality,
            "latitude": c.latitude,
            "longitude": c.longitude,
            "cluster_id": c.cluster_id,
            "created_at": c.created_at.isoformat()
        }
        for c in complaints
    ]

    # Also return candidate clusters that have valid centroids
    clusters = db.query(ComplaintCluster).filter(
        ComplaintCluster.centroid_lat.isnot(None),
        ComplaintCluster.centroid_lon.isnot(None)
    ).all()

    cluster_overlays = [
        {
            "id": cl.id,
            "cluster_code": cl.cluster_code,
            "title": cl.title,
            "category": cl.category,
            "complaint_count": cl.complaint_count,
            "centroid_lat": cl.centroid_lat,
            "centroid_lon": cl.centroid_lon,
            "spread_radius_meters": cl.spread_radius_meters,
            "status": cl.status.value,
            "priority_score": cl.priority_score
        }
        for cl in clusters
    ]

    return {
        "complaints": points,
        "clusters": cluster_overlays,
        "total_geocoded": len(points)
    }
