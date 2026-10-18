import math
from datetime import datetime
from typing import List, Dict, Any, Optional
import numpy as np
from server.app.core.config import settings
from server.app.ml.embeddings import embedding_service

def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two GPS points on Earth in meters."""
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

class SemanticSimilarityEngine:
    """Multi-signal similarity engine combining vector semantics, geolocation proximity, category match, and time delta."""

    def __init__(self, default_threshold: Optional[float] = None):
        self.default_threshold = default_threshold or settings.SIMILARITY_THRESHOLD

    def find_similar_complaints(
        self,
        query_complaint: Dict[str, Any],
        candidate_complaints: List[Dict[str, Any]],
        top_k: int = 5,
        threshold: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        """
        Rank candidate complaints against query complaint across semantic and geographic dimensions.
        """
        effective_threshold = threshold if threshold is not None else self.default_threshold
        query_vec = query_complaint.get("embedding_array")
        if query_vec is None:
            raw_emb = query_complaint.get("embedding")
            query_vec = embedding_service.deserialize_embedding(raw_emb)
        if query_vec is None and query_complaint.get("description"):
            query_vec = embedding_service.encode(f"{query_complaint.get('title', '')} {query_complaint.get('description', '')}")

        if query_vec is None:
            return []

        scored_matches = []

        q_lat = query_complaint.get("latitude")
        q_lon = query_complaint.get("longitude")
        q_cat = query_complaint.get("category")
        q_time = query_complaint.get("created_at")
        q_cluster_id = query_complaint.get("cluster_id")
        q_id = query_complaint.get("id")

        for cand in candidate_complaints:
            cand_id = cand.get("id")
            if cand_id == q_id:
                continue

            cand_vec = cand.get("embedding_array")
            if cand_vec is None:
                cand_vec = embedding_service.deserialize_embedding(cand.get("embedding"))
            if cand_vec is None and cand.get("description"):
                cand_vec = embedding_service.encode(f"{cand.get('title', '')} {cand.get('description', '')}")

            if cand_vec is None:
                continue

            # 1. Semantic Cosine Score
            cosine_score = embedding_service.cosine_similarity(query_vec, cand_vec)

            # 2. Location Distance
            c_lat = cand.get("latitude")
            c_lon = cand.get("longitude")
            distance_meters = None
            spatial_match = False
            if q_lat is not None and q_lon is not None and c_lat is not None and c_lon is not None:
                distance_meters = haversine_distance_meters(q_lat, q_lon, c_lat, c_lon)
                # Within 500 meters is strong spatial correlation
                spatial_match = distance_meters <= 500.0
            elif query_complaint.get("locality") and cand.get("locality"):
                spatial_match = query_complaint["locality"].strip().lower() == cand["locality"].strip().lower()

            # 3. Category Match
            same_category = (q_cat == cand.get("category")) if q_cat else False

            # 4. Temporal Proximity
            c_time = cand.get("created_at")
            days_diff = None
            if isinstance(q_time, datetime) and isinstance(c_time, datetime):
                days_diff = abs((q_time - c_time).total_seconds()) / 86400.0

            # 5. Composite Match Evaluation
            # Cosine similarity must satisfy the threshold, OR have strong similarity + spatial match
            composite_score = cosine_score
            if same_category:
                composite_score += 0.05
            if spatial_match:
                composite_score += 0.08

            is_potential_duplicate = (cosine_score >= effective_threshold) or (cosine_score >= (effective_threshold - 0.1) and spatial_match and same_category)

            if is_potential_duplicate or cosine_score >= (effective_threshold - 0.12):
                signals = []
                if cosine_score >= 0.8:
                    signals.append("High semantic text similarity")
                elif cosine_score >= 0.65:
                    signals.append("Moderate semantic similarity")
                if spatial_match:
                    signals.append(f"Geographic proximity ({round(distance_meters)}m)" if distance_meters is not None else f"Shared locality: {cand.get('locality')}")
                if same_category:
                    signals.append("Matching civic category")
                if days_diff is not None and days_diff <= 14:
                    signals.append(f"Reported within {round(days_diff)} days")

                is_same_cluster = (q_cluster_id is not None and q_cluster_id == cand.get("cluster_id"))

                scored_matches.append({
                    "complaint_id": cand_id,
                    "reference_no": cand.get("reference_no", f"CP-{cand_id}"),
                    "title": cand.get("title", ""),
                    "category": cand.get("category", ""),
                    "locality": cand.get("locality"),
                    "status": cand.get("status", "submitted"),
                    "similarity_score": round(cosine_score, 4),
                    "composite_score": round(composite_score, 4),
                    "distance_meters": round(distance_meters, 1) if distance_meters is not None else None,
                    "is_same_cluster": is_same_cluster,
                    "signals": signals,
                    "explanation": " • ".join(signals) if signals else "Semantic content correlation"
                })

        # Rank by composite score descending
        scored_matches.sort(key=lambda x: x["composite_score"], reverse=True)
        return scored_matches[:top_k]

similarity_engine = SemanticSimilarityEngine()
