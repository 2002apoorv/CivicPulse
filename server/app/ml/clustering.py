import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
from sklearn.cluster import DBSCAN
from server.app.ml.embeddings import embedding_service
from server.app.ml.similarity import haversine_distance_meters
from server.app.models.cluster import ClusterStatus

class ComplaintClusteringEngine:
    """Spatio-temporal and semantic clustering engine for detecting recurring civic issues."""

    def __init__(self, semantic_eps: float = 0.35, min_samples: int = 2, max_spatial_meters: float = 800.0):
        # In cosine distance: dist = 1 - cosine_similarity. If cosine_sim >= 0.65, dist <= 0.35.
        self.semantic_eps = semantic_eps
        self.min_samples = min_samples
        self.max_spatial_meters = max_spatial_meters

    def detect_clusters(self, complaints: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Group complaints into candidate recurring issue clusters based on:
        1. Category match
        2. Semantic vector cosine similarity
        3. Geospatial proximity (if coordinates present)
        """
        if len(complaints) < self.min_samples:
            return []

        # Group first by Category to enforce category coherence
        by_category: Dict[str, List[Dict[str, Any]]] = {}
        for c in complaints:
            cat = c.get("category", "Other")
            by_category.setdefault(cat, []).append(c)

        candidate_clusters: List[Dict[str, Any]] = []

        for category, cat_complaints in by_category.items():
            if len(cat_complaints) < self.min_samples:
                continue

            # Extract or parse vectors
            vectors = []
            valid_complaints = []
            for c in cat_complaints:
                vec = c.get("embedding_array")
                if vec is None:
                    vec = embedding_service.deserialize_embedding(c.get("embedding"))
                if vec is None and c.get("description"):
                    vec = embedding_service.encode(f"{c.get('title', '')} {c.get('description', '')}")
                if vec is not None:
                    vectors.append(vec)
                    valid_complaints.append(c)

            if len(valid_complaints) < self.min_samples:
                continue

            X = np.array(vectors, dtype=np.float32)

            # DBSCAN with cosine metric: metric='cosine' uses 1 - cosine_similarity
            clustering = DBSCAN(eps=self.semantic_eps, min_samples=self.min_samples, metric='cosine')
            labels = clustering.fit_predict(X)

            # Group by cluster labels
            clusters_map: Dict[int, List[int]] = {}
            for idx, label in enumerate(labels):
                if label != -1:  # -1 represents noise in DBSCAN
                    clusters_map.setdefault(label, []).append(idx)

            for label_id, member_indices in clusters_map.items():
                member_complaints = [valid_complaints[i] for i in member_indices]
                member_vectors = [vectors[i] for i in member_indices]

                # Verify spatial constraint: if members have coordinates, check they aren't miles apart
                spatially_coherent_groups = self._filter_spatial_coherence(member_complaints, member_vectors)

                for group_complaints, group_vectors in spatially_coherent_groups:
                    if len(group_complaints) < self.min_samples:
                        continue

                    cluster_data = self._build_cluster_summary(category, group_complaints, group_vectors)
                    candidate_clusters.append(cluster_data)

        return candidate_clusters

    def _filter_spatial_coherence(
        self,
        complaints: List[Dict[str, Any]],
        vectors: List[np.ndarray]
    ) -> List[Tuple[List[Dict[str, Any]], List[np.ndarray]]]:
        """Split a cluster if subgroups are located in completely different parts of the city."""
        # Check if coordinates exist
        has_coords = [c for c in complaints if c.get("latitude") is not None and c.get("longitude") is not None]
        if len(has_coords) <= 1:
            return [(complaints, vectors)]

        # If spatial spread exceeds max_spatial_meters, sub-cluster spatially
        groups = []
        visited = set()

        for i, c1 in enumerate(complaints):
            if i in visited:
                continue
            current_group_c = [c1]
            current_group_v = [vectors[i]]
            visited.add(i)

            lat1, lon1 = c1.get("latitude"), c1.get("longitude")

            for j in range(i + 1, len(complaints)):
                if j in visited:
                    continue
                c2 = complaints[j]
                lat2, lon2 = c2.get("latitude"), c2.get("longitude")

                # If both have coordinates, check distance
                if lat1 is not None and lon1 is not None and lat2 is not None and lon2 is not None:
                    dist = haversine_distance_meters(lat1, lon1, lat2, lon2)
                    if dist <= self.max_spatial_meters:
                        current_group_c.append(c2)
                        current_group_v.append(vectors[j])
                        visited.add(j)
                else:
                    # Same locality text match
                    if c1.get("locality") and c2.get("locality") and c1["locality"].lower() == c2["locality"].lower():
                        current_group_c.append(c2)
                        current_group_v.append(vectors[j])
                        visited.add(j)

            groups.append((current_group_c, current_group_v))

        return groups

    def _build_cluster_summary(
        self,
        category: str,
        complaints: List[Dict[str, Any]],
        vectors: List[np.ndarray]
    ) -> Dict[str, Any]:
        """Compute centroid, representative complaint, geographic spread, and extractive summary."""
        # 1. Compute Centroid vector
        vec_matrix = np.array(vectors, dtype=np.float32)
        centroid = np.mean(vec_matrix, axis=0)
        norm = np.linalg.norm(centroid)
        if norm > 0:
            centroid = centroid / norm

        # 2. Find representative complaint (closest to centroid)
        best_sim = -1.0
        rep_idx = 0
        similarities = []
        for i, v in enumerate(vectors):
            sim = float(np.dot(v, centroid))
            similarities.append(sim)
            if sim > best_sim:
                best_sim = sim
                rep_idx = i

        representative = complaints[rep_idx]

        # 3. Timestamps
        timestamps = []
        for c in complaints:
            t = c.get("created_at")
            if isinstance(t, str):
                try:
                    t = datetime.fromisoformat(t.replace("Z", "+00:00"))
                except Exception:
                    t = datetime.utcnow()
            elif not isinstance(t, datetime):
                t = datetime.utcnow()
            timestamps.append(t)

        first_reported = min(timestamps) if timestamps else datetime.utcnow()
        latest_reported = max(timestamps) if timestamps else datetime.utcnow()

        # 4. Geospatial Centroid & Spread
        coords = [(c["latitude"], c["longitude"]) for c in complaints if c.get("latitude") is not None and c.get("longitude") is not None]
        centroid_lat, centroid_lon, max_radius = None, None, None
        if coords:
            centroid_lat = sum(p[0] for p in coords) / len(coords)
            centroid_lon = sum(p[1] for p in coords) / len(coords)
            # Compute spread
            radii = [haversine_distance_meters(centroid_lat, centroid_lon, p[0], p[1]) for p in coords]
            max_radius = max(radii) if radii else 0.0

        # 5. Locality common name
        localities = [c.get("locality") for c in complaints if c.get("locality")]
        loc_str = localities[0] if localities else "Varanasi"

        # 6. Title and Extractive Summary
        title = f"Recurring {category} at {loc_str}"
        summary = (
            f"Candidate cluster of {len(complaints)} related reports in {loc_str}. "
            f"Key grievance pattern: \"{representative.get('title', '')}\" — "
            f"{representative.get('description', '')[:140]}... "
            f"First reported {first_reported.strftime('%b %d')} with recurring reports continuing through {latest_reported.strftime('%b %d')}."
        )

        # 7. Priority score
        # Priority increases with complaint count, recency, and member priorities
        base_priority = 50.0 + min(35.0, len(complaints) * 7.0)

        cluster_code = f"CLUST-{category[:3].upper()}-{uuid.uuid4().hex[:6].upper()}"

        return {
            "cluster_code": cluster_code,
            "title": title,
            "category": category,
            "summary": summary,
            "representative_complaint_id": representative.get("id"),
            "complaint_count": len(complaints),
            "first_reported_at": first_reported,
            "latest_reported_at": latest_reported,
            "centroid_lat": round(centroid_lat, 6) if centroid_lat is not None else None,
            "centroid_lon": round(centroid_lon, 6) if centroid_lon is not None else None,
            "spread_radius_meters": round(max_radius, 1) if max_radius is not None else None,
            "status": ClusterStatus.CANDIDATE,
            "priority_score": round(base_priority, 1),
            "assigned_department_id": representative.get("assigned_department_id"),
            "members": [
                {
                    "complaint_id": c.get("id"),
                    "similarity_to_centroid": round(similarities[i], 4)
                }
                for i, c in enumerate(complaints)
            ]
        }

clustering_engine = ComplaintClusteringEngine()
