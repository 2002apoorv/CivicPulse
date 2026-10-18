import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from server.app.database.base import Base

class ComplaintStatus(str, enum.Enum):
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"

class PriorityLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class CivicCategory(str, enum.Enum):
    ROADS_AND_POTHOLES = "Roads and Potholes"
    GARBAGE_AND_WASTE = "Garbage and Waste"
    WATER_SUPPLY = "Water Supply"
    DRAINAGE_AND_SEWAGE = "Drainage and Sewage"
    STREETLIGHTS = "Streetlights"
    PUBLIC_SANITATION = "Public Sanitation"
    TRAFFIC_AND_SAFETY = "Traffic and Road Safety"
    PUBLIC_INFRASTRUCTURE = "Public Infrastructure"
    ELECTRICITY = "Electricity"
    OTHER = "Other"

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    reference_no = Column(String(32), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)

    # Citizen submitter
    citizen_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Classification fields
    category = Column(String(100), default=CivicCategory.OTHER.value, nullable=False, index=True)
    user_selected_category = Column(String(100), nullable=True)
    ai_predicted_category = Column(String(100), nullable=True)
    ai_confidence = Column(Float, nullable=True)
    requires_human_review = Column(Boolean, default=False, nullable=False)

    # Lifecycle & Priority
    status = Column(Enum(ComplaintStatus), default=ComplaintStatus.SUBMITTED, nullable=False, index=True)
    priority = Column(Enum(PriorityLevel), default=PriorityLevel.MEDIUM, nullable=False, index=True)
    priority_score = Column(Float, default=50.0, nullable=False)
    priority_reason = Column(Text, nullable=True)

    # Department & Officer Routing
    assigned_department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True, index=True)
    assigned_officer_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    # Clustering
    cluster_id = Column(Integer, ForeignKey("complaint_clusters.id", ondelete="SET NULL"), nullable=True, index=True)

    # Location Information
    location_text = Column(String(500), nullable=True)
    locality = Column(String(150), nullable=True, index=True)
    ward = Column(String(100), nullable=True)
    city = Column(String(100), default="Varanasi", nullable=False, index=True)
    latitude = Column(Float, nullable=True, index=True)
    longitude = Column(Float, nullable=True, index=True)
    has_verified_coordinates = Column(Boolean, default=False, nullable=False, index=True)

    # Semantic Embedding vector serialized as JSON string or pgvector
    embedding = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    resolved_at = Column(DateTime, nullable=True)

    # Relationships
    citizen = relationship("User", back_populates="complaints", foreign_keys=[citizen_id])
    assigned_officer = relationship("User", back_populates="assigned_complaints", foreign_keys=[assigned_officer_id])
    assigned_department = relationship("Department", back_populates="complaints")
    cluster = relationship("ComplaintCluster", back_populates="complaints", foreign_keys=[cluster_id])
    attachments = relationship("ComplaintAttachment", back_populates="complaint", cascade="all, delete-orphan")
    classifications = relationship("ComplaintClassification", back_populates="complaint", cascade="all, delete-orphan")
    extracted_locations = relationship("ComplaintLocation", back_populates="complaint", cascade="all, delete-orphan")
    status_history = relationship("ComplaintStatusHistory", back_populates="complaint", cascade="all, delete-orphan")
    cluster_memberships = relationship("ClusterMembership", back_populates="complaint", cascade="all, delete-orphan")
