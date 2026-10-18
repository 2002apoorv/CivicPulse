from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from server.app.database.base import Base

class ComplaintStatusHistory(Base):
    __tablename__ = "complaint_status_history"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    previous_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    changed_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    complaint = relationship("Complaint", back_populates="status_history")
    changed_by = relationship("User", foreign_keys=[changed_by_id])

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(50), nullable=False, index=True)  # 'complaint', 'cluster', 'classification', 'user'
    entity_id = Column(Integer, nullable=False, index=True)
    action = Column(String(100), nullable=False)  # 'create', 'status_change', 'reclassify', 'merge_cluster', etc.
    performed_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    changes_json = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    performed_by = relationship("User", foreign_keys=[performed_by_id])
