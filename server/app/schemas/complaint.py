from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from server.app.models.complaint import ComplaintStatus, PriorityLevel, CivicCategory
from server.app.schemas.user import UserResponse
from server.app.schemas.department import DepartmentResponse

class ComplaintCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=255)
    description: str = Field(..., min_length=10)
    category: Optional[str] = None  # user selected or null
    location_text: Optional[str] = None
    locality: Optional[str] = None
    ward: Optional[str] = None
    city: Optional[str] = "Varanasi"
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class ComplaintUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    location_text: Optional[str] = None
    locality: Optional[str] = None
    ward: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    priority: Optional[PriorityLevel] = None
    assigned_department_id: Optional[int] = None
    assigned_officer_id: Optional[int] = None

class ComplaintStatusUpdate(BaseModel):
    status: ComplaintStatus
    notes: Optional[str] = None

class ComplaintReclassify(BaseModel):
    new_category: str
    reason: str

class ComplaintAttachmentResponse(BaseModel):
    id: int
    file_path: str
    file_name: str
    file_type: str
    file_size: int
    created_at: datetime

    class Config:
        from_attributes = True

class ComplaintLocationResponse(BaseModel):
    id: int
    raw_mention: str
    entity_type: Optional[str] = None
    normalized_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    confidence: float
    is_geocoded: bool
    resolution_source: str
    created_at: datetime

    class Config:
        from_attributes = True

class ComplaintClassificationResponse(BaseModel):
    id: int
    predicted_category: str
    confidence: float
    model_version: str
    top_probabilities_json: Optional[str] = None
    is_human_corrected: bool
    corrected_category: Optional[str] = None
    correction_reason: Optional[str] = None
    corrected_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ComplaintStatusHistoryResponse(BaseModel):
    id: int
    previous_status: Optional[str] = None
    new_status: str
    notes: Optional[str] = None
    changed_by: Optional[UserResponse] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ComplaintResponse(BaseModel):
    id: int
    reference_no: str
    title: str
    description: str
    citizen_id: int
    category: str
    user_selected_category: Optional[str] = None
    ai_predicted_category: Optional[str] = None
    ai_confidence: Optional[float] = None
    requires_human_review: bool
    status: ComplaintStatus
    priority: PriorityLevel
    priority_score: float
    priority_reason: Optional[str] = None
    assigned_department_id: Optional[int] = None
    assigned_officer_id: Optional[int] = None
    cluster_id: Optional[int] = None
    location_text: Optional[str] = None
    locality: Optional[str] = None
    ward: Optional[str] = None
    city: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    has_verified_coordinates: bool
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None

    assigned_department: Optional[DepartmentResponse] = None

    class Config:
        from_attributes = True

class SimilarComplaintMatch(BaseModel):
    complaint_id: int
    reference_no: str
    title: str
    category: str
    locality: Optional[str] = None
    status: str
    similarity_score: float
    distance_meters: Optional[float] = None
    is_same_cluster: bool

class ComplaintDetailResponse(ComplaintResponse):
    citizen: Optional[UserResponse] = None
    assigned_officer: Optional[UserResponse] = None
    attachments: List[ComplaintAttachmentResponse] = []
    classifications: List[ComplaintClassificationResponse] = []
    extracted_locations: List[ComplaintLocationResponse] = []
    status_history: List[ComplaintStatusHistoryResponse] = []
    similar_complaints: List[SimilarComplaintMatch] = []
