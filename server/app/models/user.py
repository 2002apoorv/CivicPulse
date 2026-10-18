import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from server.app.database.base import Base

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    OFFICER = "officer"
    CITIZEN = "citizen"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.CITIZEN, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    phone_number = Column(String(50), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    department = relationship("Department", back_populates="officers")
    complaints = relationship("Complaint", back_populates="citizen", foreign_keys="Complaint.citizen_id")
    assigned_complaints = relationship("Complaint", back_populates="assigned_officer", foreign_keys="Complaint.assigned_officer_id")
