from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class DashboardKPIs(BaseModel):
    total_complaints: int
    complaints_today: int
    open_complaints: int
    resolved_complaints: int
    resolution_rate_percent: float
    avg_resolution_time_hours: float
    high_priority_count: int
    potential_duplicate_count: int
    active_clusters_count: int

class TrendPoint(BaseModel):
    date: str
    submitted: int
    resolved: int

class CategoryBreakdown(BaseModel):
    category: str
    count: int
    percentage: float
    avg_resolution_hours: Optional[float] = None

class StatusBreakdown(BaseModel):
    status: str
    count: int
    percentage: float

class PriorityBreakdown(BaseModel):
    priority: str
    count: int
    percentage: float

class LocalityHotspot(BaseModel):
    locality: str
    count: int
    high_priority_count: int
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class DepartmentWorkloadItem(BaseModel):
    department_id: int
    department_name: str
    open_tickets: int
    resolved_tickets: int
    avg_resolution_hours: float

class CivicInsight(BaseModel):
    id: str
    type: str  # 'surge', 'hotspot', 'cluster', 'bottleneck'
    title: str
    description: str
    metric_value: str
    severity: str  # 'info', 'warning', 'critical'
    suggested_action: str
