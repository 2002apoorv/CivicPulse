from typing import Optional, Dict
from sqlalchemy.orm import Session
from server.app.models.department import Department

CATEGORY_TO_DEPARTMENT_CODE: Dict[str, str] = {
    "Roads and Potholes": "ROAD_MAINT",
    "Garbage and Waste": "SANITATION",
    "Water Supply": "WATER_DEPT",
    "Drainage and Sewage": "DRAINAGE",
    "Streetlights": "ELEC_MAINT",
    "Public Sanitation": "SANITATION",
    "Traffic and Road Safety": "TRAFFIC_ENG",
    "Public Infrastructure": "PUBLIC_WORKS",
    "Electricity": "ELEC_MAINT",
    "Other": "GENERAL_CELL"
}

INITIAL_DEPARTMENTS = [
    {"name": "Road Maintenance", "code": "ROAD_MAINT", "description": "Maintenance and repair of roads, bridges, and pavements.", "contact_email": "roads@civicpulse.local"},
    {"name": "Sanitation Department", "code": "SANITATION", "description": "Garbage disposal, waste management, and public hygiene.", "contact_email": "sanitation@civicpulse.local"},
    {"name": "Water Supply Department", "code": "WATER_DEPT", "description": "Drinking water pipelines, water treatment, and leakage repairs.", "contact_email": "water@civicpulse.local"},
    {"name": "Drainage and Sewage", "code": "DRAINAGE", "description": "Underground sewer lines, stormwater drains, and flood management.", "contact_email": "drainage@civicpulse.local"},
    {"name": "Electrical Maintenance", "code": "ELEC_MAINT", "description": "Streetlights, civic transformers, and municipal electrical infrastructure.", "contact_email": "electrical@civicpulse.local"},
    {"name": "Traffic and Road Safety", "code": "TRAFFIC_ENG", "description": "Traffic lights, pedestrian crossings, speed calming, and road safety.", "contact_email": "traffic@civicpulse.local"},
    {"name": "Public Works Department", "code": "PUBLIC_WORKS", "description": "Municipal buildings, public parks, bus stops, and structural civic assets.", "contact_email": "pwd@civicpulse.local"},
    {"name": "General Grievance Cell", "code": "GENERAL_CELL", "description": "Cross-cutting civic complaints and non-specialized municipal inquiries.", "contact_email": "grievance@civicpulse.local"}
]

def suggest_department_for_category(category: str, db: Session) -> Optional[Department]:
    """Look up the responsible department corresponding to a category."""
    dept_code = CATEGORY_TO_DEPARTMENT_CODE.get(category, "GENERAL_CELL")
    department = db.query(Department).filter(Department.code == dept_code).first()
    if not department:
        # Fallback to first available active department
        department = db.query(Department).filter(Department.is_active == True).first()
    return department
