import json
import hashlib
import numpy as np
from typing import List, Union, Optional
from server.app.core.config import settings
from server.app.ml.preprocessing import clean_text

class EmbeddingService:
    """CPU-friendly semantic vector embedding service using SentenceTransformers with robust offline fallback."""

    def __init__(self, model_name: Optional[str] = None):
        self.model_name = model_name or settings.EMBEDDING_MODEL_NAME
        self._model = None
        self._is_loaded = False
        self.embedding_dim = 384

    def _get_model(self):
        if not self._is_loaded:
            try:
                from sentence_transformers import SentenceTransformer
                # Load lightweight model for CPU inference
                self._model = SentenceTransformer(self.model_name)
                self.embedding_dim = self._model.get_sentence_embedding_dimension()
                self._is_loaded = True
                print(f"[Info] Loaded SentenceTransformer model '{self.model_name}' (dim={self.embedding_dim})")
            except Exception as e:
                print(f"[Warning] SentenceTransformer load failed or offline: {e}. Using deterministic semantic projection fallback.")
                self._model = None
                self._is_loaded = True
        return self._model

    def encode(self, texts: Union[str, List[str]]) -> np.ndarray:
        """Encode text or list of texts into L2-normalized 384-dim dense embeddings."""
        is_single = isinstance(texts, str)
        text_list = [clean_text(texts)] if is_single else [clean_text(t) for t in texts]

        model = self._get_model()
        if model is not None:
            try:
                embeddings = model.encode(
                    text_list,
                    convert_to_numpy=True,
                    normalize_embeddings=True,
                    show_progress_bar=False
                )
                return embeddings[0] if is_single else embeddings
            except Exception as e:
                print(f"[Warning] SentenceTransformer encoding error: {e}. Using fallback.")

        # Deterministic hashing semantic projection fallback
        fallback_vecs = np.array([self._deterministic_semantic_vector(t) for t in text_list], dtype=np.float32)
        return fallback_vecs[0] if is_single else fallback_vecs

    def _deterministic_semantic_vector(self, text: str) -> np.ndarray:
        """High-dimensional word-hash n-gram projection with L2 normalization."""
        vec = np.zeros(self.embedding_dim, dtype=np.float32)
        tokens = text.lower().split()
        if not tokens:
            vec[0] = 1.0
            return vec

        # Unigrams & Bigrams
        features = tokens.copy()
        for i in range(len(tokens) - 1):
            features.append(f"{tokens[i]}_{tokens[i+1]}")

        for feat in features:
            h = int(hashlib.md5(feat.encode('utf-8')).hexdigest(), 16)
            idx = h % self.embedding_dim
            sign = 1.0 if (h >> 8) % 2 == 0 else -1.0
            weight = 1.5 if "_" in feat else 1.0
            vec[idx] += sign * weight

        # L2 normalize
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec

    @staticmethod
    def serialize_embedding(embedding: np.ndarray) -> str:
        """Serialize numpy vector to JSON string for database storage."""
        if isinstance(embedding, np.ndarray):
            return json.dumps(embedding.tolist())
        elif isinstance(embedding, list):
            return json.dumps(embedding)
        return str(embedding)

    @staticmethod
    def deserialize_embedding(embedding_str: Optional[str]) -> Optional[np.ndarray]:
        """Deserialize JSON string into numpy vector."""
        if not embedding_str:
            return None
        try:
            arr = json.loads(embedding_str)
            return np.array(arr, dtype=np.float32)
        except Exception:
            return None

    @staticmethod
    def cosine_similarity(vec_a: np.ndarray, vec_b: np.ndarray) -> float:
        """Compute cosine similarity between two unit-normalized vectors."""
        norm_a = np.linalg.norm(vec_a)
        norm_b = np.linalg.norm(vec_b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(np.dot(vec_a, vec_b) / (norm_a * norm_b))

embedding_service = EmbeddingService()
