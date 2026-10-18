import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from server.app.database.base import Base

class ClusterStatus(str, enum.Enum):
    CANDIDATE = "candidate"
    CONFIRMED = "confirmed"
    REJECTED = "rejected"
    RESOLVED = "resolved"

class ComplaintCluster(Base):
    __tablename__ = "complaint_clusters"

    id = Column(Integer, primary_key=True, index=True)
    cluster_code = Column(String(32), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False, index=True)
    summary = Column(Text, nullable=False)
    representative_complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="SET NULL"), nullable=True)

    complaint_count = Column(Integer, default=1, nullable=False)
    first_reported_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    latest_reported_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    centroid_lat = Column(Float, nullable=True)
    centroid_lon = Column(Float, nullable=True)
    spread_radius_meters = Column(Float, nullable=True)

    status = Column(Enum(ClusterStatus), default=ClusterStatus.CANDIDATE, nullable=False, index=True)
    priority_score = Column(Float, default=50.0, nullable=False)
    assigned_department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True, index=True)

    is_human_verified = Column(Boolean, default=False, nullable=False)
    verified_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    verified_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    complaints = relationship("Complaint", back_populates="cluster", foreign_keys="Complaint.cluster_id")
    assigned_department = relationship("Department", back_populates="clusters")
    verified_by = relationship("User", foreign_keys=[verified_by_id])
    members = relationship("ClusterMembership", back_populates="cluster", cascade="all, delete-orphan")

class ClusterMembership(Base):
    __tablename__ = "cluster_memberships"

    id = Column(Integer, primary_key=True, index=True)
    cluster_id = Column(Integer, ForeignKey("complaint_clusters.id", ondelete="CASCADE"), nullable=False, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    similarity_to_centroid = Column(Float, default=1.0, nullable=False)
    is_manually_assigned = Column(Boolean, default=False, nullable=False)
    added_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    removed_at = Column(DateTime, nullable=True)

    cluster = relationship("ComplaintCluster", back_populates="members")
    complaint = relationship("Complaint", back_populates="cluster_memberships")
