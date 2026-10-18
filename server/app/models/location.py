from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship
from server.app.database.base import Base

class ComplaintLocation(Base):
    __tablename__ = "complaint_locations"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    raw_mention = Column(String(255), nullable=False)
    entity_type = Column(String(50), nullable=True)  # e.g., 'GPE', 'FAC', 'LOC', 'CROSSING', 'LANDMARK'
    normalized_name = Column(String(255), nullable=True, index=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    confidence = Column(Float, default=1.0, nullable=False)
    is_geocoded = Column(Boolean, default=False, nullable=False)
    resolution_source = Column(String(50), default="gazetteer", nullable=False)  # 'gazetteer', 'ner', 'nominatim', 'user'
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    complaint = relationship("Complaint", back_populates="extracted_locations")
