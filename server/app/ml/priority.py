import re
from typing import Dict, Any, Tuple
from server.app.models.complaint import PriorityLevel

# High hazard keywords indicating immediate risk to life, safety, or severe health
CRITICAL_SEVERITY_KEYWORDS = [
    "sparking", "electric shock", "hanging wire", "loose wire", "transformer burst",
    "collapsed", "sinkhole", "deep crater", "open manhole", "death", "casualty",
    "sewage overflow in house", "water pipe burst", "fire", "toxic", "falling pole", "electrocution"
]

HIGH_SEVERITY_KEYWORDS = [
    "danger", "dangerous", "accident", "swerving", "injured", "hospital", "flooded",
    "waterlogging", "stagnant water", "dengue", "contamination", "blackout",
    "unbearable smell", "blocked road", "skidding", "slippery", "two-wheeler fall"
]

MEDIUM_SEVERITY_KEYWORDS = [
    "struggling", "pothole", "garbage dump", "clogged", "no light", "low pressure",
    "overflowing bin", "delay", "broken tap", "damaged pavement"
]

CATEGORY_RISK_WEIGHTS = {
    "Electricity": 25.0,
    "Drainage and Sewage": 20.0,
    "Roads and Potholes": 18.0,
    "Water Supply": 15.0,
    "Traffic and Road Safety": 18.0,
    "Public Infrastructure": 14.0,
    "Garbage and Waste": 12.0,
    "Public Sanitation": 12.0,
    "Streetlights": 10.0,
    "Other": 8.0
}

def calculate_priority_score(
    title: str,
    description: str,
    category: str,
    related_complaint_count: int = 0,
    has_verified_location: bool = False
) -> Tuple[PriorityLevel, float, str]:
    """
    Compute transparent priority score (0 - 100), PriorityLevel, and explainable factor breakdown.
    """
    text = f"{title} {description}".lower()

    base_score = CATEGORY_RISK_WEIGHTS.get(category, 10.0)
    reasons = [f"Category baseline risk ({category}): +{int(base_score)} pts"]

    # Hazard keyword evaluation
    critical_matches = [kw for kw in CRITICAL_SEVERITY_KEYWORDS if kw in text]
    high_matches = [kw for kw in HIGH_SEVERITY_KEYWORDS if kw in text]
    medium_matches = [kw for kw in MEDIUM_SEVERITY_KEYWORDS if kw in text]

    hazard_score = 0.0
    if critical_matches:
        hazard_score += 40.0
        reasons.append(f"Critical safety triggers ({', '.join(critical_matches[:2])}): +40 pts")
    elif high_matches:
        hazard_score += 25.0
        reasons.append(f"High risk indicators ({', '.join(high_matches[:2])}): +25 pts")
    elif medium_matches:
        hazard_score += 12.0
        reasons.append(f"Standard civic severity cues ({', '.join(medium_matches[:2])}): +12 pts")

    # Concentration / Recurring reports factor
    concentration_score = 0.0
    if related_complaint_count >= 5:
        concentration_score = 25.0
        reasons.append(f"High recurring volume ({related_complaint_count}+ duplicate reports): +25 pts")
    elif related_complaint_count >= 2:
        concentration_score = 15.0
        reasons.append(f"Multiple citizen reports ({related_complaint_count} reports): +15 pts")

    # Location verification factor
    location_score = 5.0 if has_verified_location else 0.0
    if location_score > 0:
        reasons.append("Verified physical coordinate landmark: +5 pts")

    # Total score calculation capped between 5 and 100
    total_score = min(100.0, max(5.0, base_score + hazard_score + concentration_score + location_score))

    # Priority level mapping
    if total_score >= 80.0 or critical_matches:
        level = PriorityLevel.CRITICAL
    elif total_score >= 60.0:
        level = PriorityLevel.HIGH
    elif total_score >= 35.0:
        level = PriorityLevel.MEDIUM
    else:
        level = PriorityLevel.LOW

    explanation = "; ".join(reasons)
    return level, round(total_score, 1), explanation
