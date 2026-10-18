from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from server.app.database.session import get_db
from server.app.models.department import Department
from server.app.models.user import User, UserRole
from server.app.schemas.department import DepartmentResponse
from server.app.schemas.user import UserResponse
from server.app.api.deps import get_current_user

router = APIRouter(prefix="/departments", tags=["Departments"])

@router.get("", response_model=List[DepartmentResponse])
def list_departments(db: Session = Depends(get_db)):
    """Public or authenticated list of all municipal departments."""
    depts = db.query(Department).filter(Department.is_active == True).all()
    return [DepartmentResponse.model_validate(d) for d in depts]

@router.get("/{department_id}/officers", response_model=List[UserResponse])
def list_department_officers(
    department_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List officers assigned to a specific department."""
    officers = db.query(User).filter(
        User.department_id == department_id,
        User.role == UserRole.OFFICER,
        User.is_active == True
    ).all()
    return [UserResponse.model_validate(u) for u in officers]
