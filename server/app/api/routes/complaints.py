import os
import uuid
import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc

from server.app.database.session import get_db
from server.app.core.config import settings
from server.app.models.user import User, UserRole
from server.app.models.complaint import Complaint, ComplaintStatus, PriorityLevel, CivicCategory
from server.app.models.classification import ComplaintClassification
from server.app.models.location import ComplaintLocation
from server.app.models.attachment import ComplaintAttachment
from server.app.models.audit import ComplaintStatusHistory, AuditLog
from server.app.schemas.complaint import (
    ComplaintCreate, ComplaintUpdate, ComplaintStatusUpdate, ComplaintReclassify,
    ComplaintResponse, ComplaintDetailResponse, SimilarComplaintMatch
)
from server.app.api.deps import get_current_user, get_optional_current_user, require_roles
from server.app.ml.classification import classifier_service
from server.app.ml.embeddings import embedding_service
from server.app.ml.location_extraction import location_service
from server.app.ml.priority import calculate_priority_score
from server.app.ml.routing import suggest_department_for_category
from server.app.ml.similarity import similarity_engine

router = APIRouter(prefix="/complaints", tags=["Complaints"])

@router.get("", response_model=dict)
def list_complaints(
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    search: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    locality: Optional[str] = None,
    sort_by: str = Query("created_at", pattern="^(created_at|priority_score|status|category)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    my_complaints_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Search and filter complaints with role-based access control and pagination.
    Citizens only access their own complaints; Officers & Admins view all complaints.
    """
    query = db.query(Complaint)

    # Citizen access control: strictly restrict to own complaints
    if current_user.role == UserRole.CITIZEN or my_complaints_only:
        query = query.filter(Complaint.citizen_id == current_user.id)

    # Search filter across title, description, reference_no, and locality
    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Complaint.title.ilike(search_fmt),
                Complaint.description.ilike(search_fmt),
                Complaint.reference_no.ilike(search_fmt),
                Complaint.locality.ilike(search_fmt)
            )
        )

    # Categorical filters
    if category:
        query = query.filter(Complaint.category == category)
    if status:
        query = query.filter(Complaint.status == status)
    if priority:
        query = query.filter(Complaint.priority == priority)
    if locality:
        query = query.filter(Complaint.locality.ilike(f"%{locality.strip()}%"))

    total_count = query.count()

    # Sorting
    order_column = getattr(Complaint, sort_by, Complaint.created_at)
    if sort_order == "desc":
        query = query.order_by(desc(order_column))
    else:
        query = query.order_by(asc(order_column))

    # Pagination
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    return {
        "items": [ComplaintResponse.model_validate(c) for c in items],
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": (total_count + page_size - 1) // page_size
    }

@router.post("", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
def submit_complaint(
    complaint_in: ComplaintCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submit a civic complaint. The automated AI pipeline executes:
    1. Category classification with confidence estimation.
    2. Location entity extraction and coordinate resolution.
    3. Dense semantic embedding generation.
    4. Transparent priority scoring.
    5. Department routing recommendation.
    """
    text_combined = f"{complaint_in.title} {complaint_in.description}"

    # 1. AI Classification
    pred = classifier_service.predict(text_combined)
    predicted_category = pred["predicted_category"]
    confidence = pred["confidence"]
    requires_review = pred["requires_human_review"]

    # Active category defaults to user selected if provided, otherwise AI prediction
    final_category = complaint_in.category or predicted_category

    # 2. AI Location Extraction & Resolution
    loc_res = location_service.resolve_primary_location(
        text=text_combined,
        user_lat=complaint_in.latitude,
        user_lon=complaint_in.longitude,
        user_locality=complaint_in.locality
    )

    # 3. AI Semantic Embedding
    embedding_vec = embedding_service.encode(text_combined)
    embedding_json = embedding_service.serialize_embedding(embedding_vec)

    # 4. Department Routing
    department = suggest_department_for_category(final_category, db)

    # 5. Priority Scoring
    priority_level, priority_score, priority_reason = calculate_priority_score(
        title=complaint_in.title,
        description=complaint_in.description,
        category=final_category,
        has_verified_location=loc_res["has_verified_coordinates"]
    )

    # Generate sequential unique reference ID
    count = db.query(Complaint).count() + 1
    reference_no = f"CP-2026-{count:05d}"

    new_complaint = Complaint(
        reference_no=reference_no,
        title=complaint_in.title,
        description=complaint_in.description,
        citizen_id=current_user.id,
        category=final_category,
        user_selected_category=complaint_in.category,
        ai_predicted_category=predicted_category,
        ai_confidence=confidence,
        requires_human_review=requires_review,
        status=ComplaintStatus.SUBMITTED,
        priority=priority_level,
        priority_score=priority_score,
        priority_reason=priority_reason,
        assigned_department_id=department.id if department else None,
        location_text=complaint_in.location_text or loc_res.get("locality"),
        locality=loc_res.get("locality") or complaint_in.locality,
        ward=loc_res.get("ward") or complaint_in.ward,
        city=complaint_in.city or "Varanasi",
        latitude=loc_res.get("latitude"),
        longitude=loc_res.get("longitude"),
        has_verified_coordinates=loc_res.get("has_verified_coordinates", False),
        embedding=embedding_json,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(new_complaint)
    db.flush()

    # Record classification prediction log
    classification_entry = ComplaintClassification(
        complaint_id=new_complaint.id,
        predicted_category=predicted_category,
        confidence=confidence,
        model_version=pred["model_version"],
        top_probabilities_json=json.dumps(pred["probabilities"]),
        created_at=datetime.utcnow()
    )
    db.add(classification_entry)

    # Record extracted location entities
    entities = location_service.extract_locations(text_combined)
    for ent in entities:
        loc_entry = ComplaintLocation(
            complaint_id=new_complaint.id,
            raw_mention=ent["raw_mention"],
            entity_type=ent["entity_type"],
            normalized_name=ent["normalized_name"],
            latitude=ent["latitude"],
            longitude=ent["longitude"],
            confidence=ent["confidence"],
            is_geocoded=ent["is_geocoded"],
            resolution_source=ent["resolution_source"],
            created_at=datetime.utcnow()
        )
        db.add(loc_entry)

    # Initial status history
    status_entry = ComplaintStatusHistory(
        complaint_id=new_complaint.id,
        previous_status=None,
        new_status=ComplaintStatus.SUBMITTED.value,
        changed_by_id=current_user.id,
        notes="Grievance filed by citizen.",
        created_at=datetime.utcnow()
    )
    db.add(status_entry)

    # Audit log
    audit_entry = AuditLog(
        entity_type="complaint",
        entity_id=new_complaint.id,
        action="create",
        performed_by_id=current_user.id,
        changes_json=json.dumps({"reference_no": reference_no, "title": new_complaint.title, "category": final_category}),
        created_at=datetime.utcnow()
    )
    db.add(audit_entry)

    db.commit()
    db.refresh(new_complaint)
    return ComplaintResponse.model_validate(new_complaint)

@router.get("/{complaint_id}", response_model=ComplaintDetailResponse)
def get_complaint_detail(
    complaint_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve full complaint details, history, attachments, and top semantically similar reports."""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")

    # Citizen access control: verify ownership
    if current_user.role == UserRole.CITIZEN and complaint.citizen_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: citizens may only view their own grievances."
        )

    # Find top semantically similar complaints across database
    candidate_records = db.query(Complaint).filter(Complaint.id != complaint.id).limit(100).all()
    candidate_dicts = [
        {
            "id": c.id,
            "reference_no": c.reference_no,
            "title": c.title,
            "description": c.description,
            "category": c.category,
            "locality": c.locality,
            "status": c.status.value,
            "latitude": c.latitude,
            "longitude": c.longitude,
            "embedding": c.embedding,
            "cluster_id": c.cluster_id,
            "created_at": c.created_at
        }
        for c in candidate_records
    ]

    target_dict = {
        "id": complaint.id,
        "title": complaint.title,
        "description": complaint.description,
        "category": complaint.category,
        "locality": complaint.locality,
        "latitude": complaint.latitude,
        "longitude": complaint.longitude,
        "embedding": complaint.embedding,
        "cluster_id": complaint.cluster_id,
        "created_at": complaint.created_at
    }

    similar_matches = similarity_engine.find_similar_complaints(
        query_complaint=target_dict,
        candidate_complaints=candidate_dicts,
        top_k=5
    )

    detail = ComplaintDetailResponse.model_validate(complaint)
    detail.similar_complaints = [SimilarComplaintMatch(**m) for m in similar_matches]
    return detail

@router.patch("/{complaint_id}/status", response_model=ComplaintResponse)
def update_complaint_status(
    complaint_id: int,
    status_update: ComplaintStatusUpdate,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.OFFICER])),
    db: Session = Depends(get_db)
):
    """Authorized civic officers and administrators update the lifecycle status with notes."""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")

    prev_status = complaint.status.value
    complaint.status = status_update.status
    complaint.updated_at = datetime.utcnow()

    if status_update.status in (ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED):
        complaint.resolved_at = datetime.utcnow()

    # Record history
    history = ComplaintStatusHistory(
        complaint_id=complaint.id,
        previous_status=prev_status,
        new_status=status_update.status.value,
        changed_by_id=current_user.id,
        notes=status_update.notes or f"Status transitioned from {prev_status} to {status_update.status.value}",
        created_at=datetime.utcnow()
    )
    db.add(history)

    # Audit log
    audit = AuditLog(
        entity_type="complaint",
        entity_id=complaint.id,
        action="status_change",
        performed_by_id=current_user.id,
        changes_json=json.dumps({"from": prev_status, "to": status_update.status.value, "notes": status_update.notes}),
        created_at=datetime.utcnow()
    )
    db.add(audit)

    db.commit()
    db.refresh(complaint)
    return ComplaintResponse.model_validate(complaint)

@router.post("/{complaint_id}/reclassify", response_model=ComplaintResponse)
def reclassify_complaint(
    complaint_id: int,
    reclassify_in: ComplaintReclassify,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.OFFICER])),
    db: Session = Depends(get_db)
):
    """
    Allow authorized officers to correct AI predictions and document why a correction was made.
    Stores human corrections for future model evaluation and training datasets.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")

    old_category = complaint.category
    new_category = reclassify_in.new_category
    reason = reclassify_in.reason.strip()

    complaint.category = new_category
    complaint.requires_human_review = False
    complaint.updated_at = datetime.utcnow()

    # Re-route department if necessary
    dept = suggest_department_for_category(new_category, db)
    if dept:
        complaint.assigned_department_id = dept.id

    # Create classification correction entry
    correction_record = ComplaintClassification(
        complaint_id=complaint.id,
        predicted_category=new_category,
        confidence=1.0,  # Human verified
        model_version="human_expert_override",
        is_human_corrected=True,
        corrected_category=new_category,
        corrected_by_id=current_user.id,
        correction_reason=reason,
        corrected_at=datetime.utcnow(),
        created_at=datetime.utcnow()
    )
    db.add(correction_record)

    # Audit log
    audit = AuditLog(
        entity_type="complaint",
        entity_id=complaint.id,
        action="reclassify",
        performed_by_id=current_user.id,
        changes_json=json.dumps({"old_category": old_category, "new_category": new_category, "reason": reason}),
        created_at=datetime.utcnow()
    )
    db.add(audit)

    db.commit()
    db.refresh(complaint)
    return ComplaintResponse.model_validate(complaint)

@router.get("/{complaint_id}/similar", response_model=List[SimilarComplaintMatch])
def get_similar_complaints(
    complaint_id: int,
    top_k: int = Query(5, ge=1, le=20),
    threshold: Optional[float] = Query(None, ge=0.0, le=1.0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve semantically and geospatially similar complaints with explainable signals."""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")

    candidate_records = db.query(Complaint).filter(Complaint.id != complaint.id).limit(150).all()
    candidate_dicts = [
        {
            "id": c.id,
            "reference_no": c.reference_no,
            "title": c.title,
            "description": c.description,
            "category": c.category,
            "locality": c.locality,
            "status": c.status.value,
            "latitude": c.latitude,
            "longitude": c.longitude,
            "embedding": c.embedding,
            "cluster_id": c.cluster_id,
            "created_at": c.created_at
        }
        for c in candidate_records
    ]

    target_dict = {
        "id": complaint.id,
        "title": complaint.title,
        "description": complaint.description,
        "category": complaint.category,
        "locality": complaint.locality,
        "latitude": complaint.latitude,
        "longitude": complaint.longitude,
        "embedding": complaint.embedding,
        "cluster_id": complaint.cluster_id,
        "created_at": complaint.created_at
    }

    matches = similarity_engine.find_similar_complaints(
        query_complaint=target_dict,
        candidate_complaints=candidate_dicts,
        top_k=top_k,
        threshold=threshold
    )
    return [SimilarComplaintMatch(**m) for m in matches]

@router.post("/{complaint_id}/attachments", response_model=dict)
def upload_attachment(
    complaint_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload photo evidence or document for a complaint with size and type validation."""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")

    # Allowed extensions
    allowed_types = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}"
        )

    ext = os.path.splitext(file.filename)[1]
    safe_filename = f"comp_{complaint_id}_{uuid.uuid4().hex[:8]}{ext}"
    dest_path = os.path.join(settings.UPLOAD_DIR, safe_filename)

    # Read and check size
    content = file.file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_BYTES // (1024*1024)}MB"
        )

    with open(dest_path, "wb") as f:
        f.write(content)

    attachment = ComplaintAttachment(
        complaint_id=complaint.id,
        file_path=f"/uploads/{safe_filename}",
        file_name=file.filename,
        file_type=file.content_type,
        file_size=len(content),
        created_at=datetime.utcnow()
    )
    db.add(attachment)
    db.commit()

    return {
        "message": "File uploaded successfully",
        "attachment_id": attachment.id,
        "file_path": attachment.file_path
    }
