import json
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from server.app.database.session import get_db
from server.app.models.user import User, UserRole
from server.app.models.model_version import ModelVersion, EvaluationRun
from server.app.models.audit import AuditLog
from server.app.schemas.user import UserResponse, UserCreate, UserUpdate
from server.app.schemas.model import ModelEvaluationSummary
from server.app.api.deps import require_roles
from server.app.core.security import get_password_hash
from server.app.ml.classification import classifier_service

router = APIRouter(prefix="/admin", tags=["Administrator Management"])

@router.get("/users", response_model=List[UserResponse])
def list_system_users(
    role: Optional[str] = None,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Admin endpoint to list all platform users and officers."""
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    users = query.order_by(desc(User.created_at)).all()
    return [UserResponse.model_validate(u) for u in users]

@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def provision_user(
    user_in: UserCreate,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Admin provisions an official Civic Officer or Administrator account."""
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    new_user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
        department_id=user_in.department_id,
        phone_number=user_in.phone_number,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return UserResponse.model_validate(new_user)

@router.patch("/users/{user_id}", response_model=UserResponse)
def update_user_status(
    user_id: int,
    user_update: UserUpdate,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Admin toggles active state or updates user profile."""
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user_update.is_active is not None:
        target_user.is_active = user_update.is_active
    if user_update.role is not None:
        target_user.role = user_update.role
    if user_update.department_id is not None:
        target_user.department_id = user_update.department_id

    db.commit()
    db.refresh(target_user)
    return UserResponse.model_validate(target_user)

@router.get("/model-evaluation", response_model=List[ModelEvaluationSummary])
def get_model_evaluation_metrics(
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.OFFICER])),
    db: Session = Depends(get_db)
):
    """
    Retrieve real evaluation metrics:
    Accuracy, macro-F1, per-class precision/recall, and confusion matrix.
    """
    eval_runs = db.query(EvaluationRun).order_by(desc(EvaluationRun.run_at)).all()
    summaries = []
    for r in eval_runs:
        mv = r.model_version
        cm = json.loads(r.confusion_matrix_json) if r.confusion_matrix_json else None
        rep = json.loads(r.classification_report_json) if r.classification_report_json else None
        labels = list(rep.keys()) if rep else []
        # Filter out macro avg / weighted avg from labels list
        clean_labels = [l for l in labels if l not in ("accuracy", "macro avg", "weighted avg")]

        summaries.append(
            ModelEvaluationSummary(
                model_version_id=r.model_version_id,
                model_name=mv.model_name if mv else "complaint_classifier",
                version=mv.version if mv else "1.0.0",
                algorithm=mv.algorithm if mv else "TF-IDF + Calibrated Logistic Regression",
                dataset_name=r.dataset_name,
                sample_count=r.sample_count,
                accuracy=round(r.accuracy, 4),
                macro_f1=round(r.macro_f1, 4),
                precision_weighted=round(r.precision_weighted, 4),
                recall_weighted=round(r.recall_weighted, 4),
                confusion_matrix=cm,
                labels=clean_labels,
                classification_report=rep,
                run_at=r.run_at
            )
        )
    return summaries

@router.get("/audit-logs", response_model=List[dict])
def get_audit_logs(
    limit: int = Query(50, ge=10, le=200),
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Retrieve security and administrative audit trail."""
    logs = db.query(AuditLog).order_by(desc(AuditLog.created_at)).limit(limit).all()
    results = []
    for l in logs:
        performed_by_name = l.performed_by.full_name if l.performed_by else "System"
        results.append({
            "id": l.id,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "action": l.action,
            "performed_by": performed_by_name,
            "changes": json.loads(l.changes_json) if l.changes_json else {},
            "created_at": l.created_at.isoformat()
        })
    return results
