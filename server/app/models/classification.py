from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from server.app.database.base import Base

class ComplaintClassification(Base):
    __tablename__ = "complaint_classifications"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    predicted_category = Column(String(100), nullable=False)
    confidence = Column(Float, nullable=False)
    model_version = Column(String(50), nullable=False)
    top_probabilities_json = Column(Text, nullable=True)  # JSON dictionary of category: score

    # Human correction tracking
    is_human_corrected = Column(Boolean, default=False, nullable=False)
    corrected_category = Column(String(100), nullable=True)
    corrected_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    correction_reason = Column(Text, nullable=True)
    corrected_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    complaint = relationship("Complaint", back_populates="classifications")
    corrected_by = relationship("User", foreign_keys=[corrected_by_id])
