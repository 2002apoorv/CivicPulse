from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class ClassificationPrediction(BaseModel):
    predicted_category: str
    confidence: float
    probabilities: Dict[str, float]
    model_version: str
    requires_human_review: bool
    explanation: Optional[str] = None

class LocationEntity(BaseModel):
    raw_mention: str
    entity_type: str
    normalized_name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    confidence: float
    is_geocoded: bool
    resolution_source: str

class ModelEvaluationSummary(BaseModel):
    model_version_id: int
    model_name: str
    version: str
    algorithm: str
    dataset_name: str
    sample_count: int
    accuracy: float
    macro_f1: float
    precision_weighted: float
    recall_weighted: float
    confusion_matrix: Optional[List[List[int]]] = None
    labels: Optional[List[str]] = None
    classification_report: Optional[Dict[str, Any]] = None
    run_at: datetime
