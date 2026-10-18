import re
import spacy
from typing import List, Dict, Any, Optional, Tuple

# Comprehensive gazetteer of verified localities, crossings, and civic landmarks in Varanasi
VARANASI_GAZETTEER: Dict[str, Dict[str, Any]] = {
    "lanka crossing": {"lat": 25.2798, "lon": 82.9996, "locality": "Lanka", "ward": "Ward 12", "type": "CROSSING"},
    "lanka": {"lat": 25.2805, "lon": 82.9990, "locality": "Lanka", "ward": "Ward 12", "type": "LOCALITY"},
    "bhu gate": {"lat": 25.2785, "lon": 82.9990, "locality": "Lanka", "ward": "Ward 12", "type": "LANDMARK"},
    "assi ghat": {"lat": 25.2905, "lon": 83.0065, "locality": "Assi", "ward": "Ward 14", "type": "LANDMARK"},
    "assi": {"lat": 25.2910, "lon": 83.0050, "locality": "Assi", "ward": "Ward 14", "type": "LOCALITY"},
    "durgakund": {"lat": 25.2891, "lon": 82.9981, "locality": "Durgakund", "ward": "Ward 15", "type": "LANDMARK"},
    "bhelupur": {"lat": 25.2974, "lon": 82.9926, "locality": "Bhelupur", "ward": "Ward 18", "type": "LOCALITY"},
    "godowlia": {"lat": 25.3094, "lon": 83.0069, "locality": "Godowlia", "ward": "Ward 22", "type": "CROSSING"},
    "godowlia chowk": {"lat": 25.3094, "lon": 83.0069, "locality": "Godowlia", "ward": "Ward 22", "type": "CROSSING"},
    "dashashwamedh": {"lat": 25.3075, "lon": 83.0105, "locality": "Dashashwamedh", "ward": "Ward 24", "type": "LANDMARK"},
    "sigra": {"lat": 25.3168, "lon": 82.9863, "locality": "Sigra", "ward": "Ward 28", "type": "LOCALITY"},
    "sigra crossing": {"lat": 25.3175, "lon": 82.9870, "locality": "Sigra", "ward": "Ward 28", "type": "CROSSING"},
    "mahmoorganj": {"lat": 25.3061, "lon": 82.9785, "locality": "Mahmoorganj", "ward": "Ward 30", "type": "LOCALITY"},
    "cantt": {"lat": 25.3267, "lon": 82.9863, "locality": "Cantonment", "ward": "Ward 35", "type": "LOCALITY"},
    "cantt railway station": {"lat": 25.3275, "lon": 82.9870, "locality": "Cantonment", "ward": "Ward 35", "type": "LANDMARK"},
    "orderly bazar": {"lat": 25.3411, "lon": 82.9882, "locality": "Orderly Bazar", "ward": "Ward 40", "type": "LOCALITY"},
    "pandeypur": {"lat": 25.3472, "lon": 82.9984, "locality": "Pandeypur", "ward": "Ward 45", "type": "LOCALITY"},
    "pandeypur crossing": {"lat": 25.3475, "lon": 82.9980, "locality": "Pandeypur", "ward": "Ward 45", "type": "CROSSING"},
    "shivpur": {"lat": 25.3621, "lon": 82.9554, "locality": "Shivpur", "ward": "Ward 50", "type": "LOCALITY"},
    "sarnath": {"lat": 25.3716, "lon": 83.0253, "locality": "Sarnath", "ward": "Ward 60", "type": "LANDMARK"},
    "lahurabir": {"lat": 25.3195, "lon": 82.9942, "locality": "Lahurabir", "ward": "Ward 25", "type": "CROSSING"},
    "maidagin": {"lat": 25.3182, "lon": 83.0118, "locality": "Maidagin", "ward": "Ward 23", "type": "CROSSING"},
    "chowk": {"lat": 25.3115, "lon": 83.0102, "locality": "Chowk", "ward": "Ward 21", "type": "LOCALITY"}
}

CROSSING_KEYWORDS = ["crossing", "chowk", "chauraha", "tiraha", "gate", "junction", "circle", "mor"]

class LocationExtractionService:
    """Named Entity Recognition & Gazetteer Resolution Service for civic grievance location extraction."""

    def __init__(self):
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except Exception:
            self.nlp = None
            print("[Warning] spaCy model en_core_web_sm not loaded in memory yet.")

    def extract_locations(self, text: str) -> List[Dict[str, Any]]:
        """
        Extract location mentions from text, map them through gazetteer or NER,
        and accurately distinguish confirmed coordinates from unresolved mentions.
        """
        if not text:
            return []

        results: List[Dict[str, Any]] = []
        found_keys = set()
        lowered_text = text.lower()

        # 1. Rule/Gazetteer exact & substring scan (highest precision for local landmarks)
        # Sort gazetteer items by string length descending to match longer multi-word phrases first
        sorted_keys = sorted(VARANASI_GAZETTEER.keys(), key=len, reverse=True)
        for key in sorted_keys:
            # Match whole phrase or word boundary
            pattern = r'\b' + re.escape(key) + r'\b'
            if re.search(pattern, lowered_text):
                data = VARANASI_GAZETTEER[key]
                # Avoid redundant shorter match if already covered by longer phrase
                if any(key in existing for existing in found_keys):
                    continue

                found_keys.add(key)
                results.append({
                    "raw_mention": key.title(),
                    "entity_type": data["type"],
                    "normalized_name": data["locality"],
                    "latitude": data["lat"],
                    "longitude": data["lon"],
                    "confidence": 0.98,
                    "is_geocoded": True,
                    "ward": data.get("ward"),
                    "resolution_source": "gazetteer"
                })

        # 2. spaCy Named Entity Recognition for novel/unmapped locations
        if self.nlp is not None:
            try:
                doc = self.nlp(text)
                for ent in doc.ents:
                    if ent.label_ in ("GPE", "LOC", "FAC"):
                        ent_text = ent.text.strip()
                        ent_lowered = ent_text.lower()
                        # Ignore general non-specific terms
                        if ent_lowered in ("varanasi", "city", "india", "state", "road", "street", "colony"):
                            continue
                        if ent_lowered not in found_keys and not any(ent_lowered in k for k in found_keys):
                            found_keys.add(ent_lowered)
                            # Check if gazetteer matches normalized version
                            if ent_lowered in VARANASI_GAZETTEER:
                                g = VARANASI_GAZETTEER[ent_lowered]
                                results.append({
                                    "raw_mention": ent_text,
                                    "entity_type": ent.label_,
                                    "normalized_name": g["locality"],
                                    "latitude": g["lat"],
                                    "longitude": g["lon"],
                                    "confidence": 0.92,
                                    "is_geocoded": True,
                                    "ward": g.get("ward"),
                                    "resolution_source": "ner_gazetteer_match"
                                })
                            else:
                                # Novel location: strictly DO NOT invent coordinates!
                                results.append({
                                    "raw_mention": ent_text,
                                    "entity_type": ent.label_,
                                    "normalized_name": ent_text.title(),
                                    "latitude": None,
                                    "longitude": None,
                                    "confidence": 0.75,
                                    "is_geocoded": False,
                                    "ward": None,
                                    "resolution_source": "spacy_ner_unresolved"
                                })
            except Exception as e:
                print(f"[Warning] spaCy NER processing failed: {e}")

        # 3. Crossing/Landmark regex pattern extraction (e.g., "near X crossing", "opposite Y mandir")
        pattern_crossing = re.compile(r'\b(?:near|at|opposite|behind|towards|around)\s+([A-Za-z0-9\s]{3,25}?(?:crossing|chowk|chauraha|gate|road|ghat|mandir))\b', re.IGNORECASE)
        for m in pattern_crossing.finditer(text):
            mention = m.group(1).strip()
            mention_low = mention.lower()
            if mention_low not in found_keys and not any(mention_low in k for k in found_keys):
                found_keys.add(mention_low)
                # Check gazetteer
                if mention_low in VARANASI_GAZETTEER:
                    g = VARANASI_GAZETTEER[mention_low]
                    results.append({
                        "raw_mention": mention,
                        "entity_type": "CROSSING",
                        "normalized_name": g["locality"],
                        "latitude": g["lat"],
                        "longitude": g["lon"],
                        "confidence": 0.95,
                        "is_geocoded": True,
                        "ward": g.get("ward"),
                        "resolution_source": "pattern_gazetteer"
                    })
                else:
                    results.append({
                        "raw_mention": mention,
                        "entity_type": "LANDMARK",
                        "normalized_name": mention.title(),
                        "latitude": None,
                        "longitude": None,
                        "confidence": 0.70,
                        "is_geocoded": False,
                        "ward": None,
                        "resolution_source": "pattern_unresolved"
                    })

        return results

    def resolve_primary_location(self, text: str, user_lat: Optional[float] = None, user_lon: Optional[float] = None, user_locality: Optional[str] = None) -> Dict[str, Any]:
        """Resolve the primary location, locality, ward, and coordinates for a complaint."""
        # 1. If explicit user coordinates were provided, use them with high confidence
        if user_lat is not None and user_lon is not None:
            return {
                "locality": user_locality or "Varanasi",
                "ward": None,
                "latitude": user_lat,
                "longitude": user_lon,
                "has_verified_coordinates": True,
                "source": "user_provided"
            }

        # 2. Extract from text
        extracted = self.extract_locations(text)
        # Find first geocoded location
        for loc in extracted:
            if loc["is_geocoded"] and loc["latitude"] is not None and loc["longitude"] is not None:
                return {
                    "locality": loc["normalized_name"],
                    "ward": loc.get("ward"),
                    "latitude": loc["latitude"],
                    "longitude": loc["longitude"],
                    "has_verified_coordinates": True,
                    "source": loc["resolution_source"]
                }

        # 3. If unverified location text found
        if extracted:
            first = extracted[0]
            return {
                "locality": first["normalized_name"],
                "ward": None,
                "latitude": None,
                "longitude": None,
                "has_verified_coordinates": False,
                "source": "unresolved_text_mention"
            }

        # 4. Default unlocated
        return {
            "locality": user_locality,
            "ward": None,
            "latitude": None,
            "longitude": None,
            "has_verified_coordinates": False,
            "source": "none"
        }

location_service = LocationExtractionService()
