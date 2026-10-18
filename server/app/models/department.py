from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from server.app.database.base import Base

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    code = Column(String(20), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    contact_email = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    officers = relationship("User", back_populates="department")
    complaints = relationship("Complaint", back_populates="assigned_department")
    clusters = relationship("ComplaintCluster", back_populates="assigned_department")
