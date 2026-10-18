from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from server.app.models.cluster import ClusterStatus
from server.app.schemas.department import DepartmentResponse
from server.app.schemas.user import UserResponse

class ClusterMemberResponse(BaseModel):
    id: int
    complaint_id: int
    similarity_to_centroid: float
    is_manually_assigned: bool
    added_at: datetime
    complaint_reference: Optional[str] = None
    complaint_title: Optional[str] = None
    complaint_status: Optional[str] = None

    class Config:
        from_attributes = True

class ClusterResponse(BaseModel):
    id: int
    cluster_code: str
    title: str
    category: str
    summary: str
    representative_complaint_id: Optional[int] = None
    complaint_count: int
    first_reported_at: datetime
    latest_reported_at: datetime
    centroid_lat: Optional[float] = None
    centroid_lon: Optional[float] = None
    spread_radius_meters: Optional[float] = None
    status: ClusterStatus
    priority_score: float
    assigned_department_id: Optional[int] = None
    is_human_verified: bool
    verified_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    assigned_department: Optional[DepartmentResponse] = None

    class Config:
        from_attributes = True

class ClusterDetailResponse(ClusterResponse):
    verified_by: Optional[UserResponse] = None
    members: List[ClusterMemberResponse] = []

class ClusterConfirmRequest(BaseModel):
    action: str = Field(..., description="'confirm' or 'reject' or 'resolve'")
    notes: Optional[str] = None

class ClusterMergeRequest(BaseModel):
    target_cluster_id: int
    reason: Optional[str] = None

class ClusterMemberMoveRequest(BaseModel):
    complaint_id: int
    target_cluster_id: Optional[int] = None  # None means detach from cluster
    reason: Optional[str] = None
