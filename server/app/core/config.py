import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    PROJECT_NAME: str = "CivicPulse — AI Grievance Intelligence"
    API_V1_PREFIX: str = "/api/v1"
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Security
    SECRET_KEY: str = "civicpulse-development-super-secret-key-change-in-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Database
    DATABASE_URL: str = "sqlite:///./civicpulse.db"

    # Vector Storage Backend ('pgvector' or 'in_memory')
    VECTOR_STORE_BACKEND: str = "in_memory"

    # CORS
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, str) and v.startswith("["):
            import json
            try:
                return json.loads(v)
            except Exception:
                return ["*"]
        elif isinstance(v, list):
            return v
        return ["*"]

    # NLP & Machine Learning Settings
    EMBEDDING_MODEL_NAME: str = "all-MiniLM-L6-v2"
    CLASSIFIER_MODEL_PATH: str = "server/app/ml/models/classifier_baseline.joblib"
    SPACY_MODEL_NAME: str = "en_core_web_sm"
    SIMILARITY_THRESHOLD: float = 0.65
    CLUSTER_EPS_METERS: float = 500.0  # 500 meters spatial distance
    CLUSTER_MIN_SAMPLES: int = 2
    CONFIDENCE_REVIEW_THRESHOLD: float = 0.35  # For 10 classes (random=0.10), predictions < 0.35 flagged for review
    LOW_MEMORY_MODE: bool = os.getenv("LOW_MEMORY_MODE", "false").lower() in ("true", "1", "yes") or os.getenv("RENDER") is not None

    # Initial Admin Bootstrap
    BOOTSTRAP_ADMIN_EMAIL: str = "admin@civicpulse.local"
    BOOTSTRAP_ADMIN_PASSWORD: str = "AdminSecurePass2026!"
    BOOTSTRAP_ADMIN_NAME: str = "System Administrator"

    # Uploads
    UPLOAD_DIR: str = "server/uploads"
    MAX_UPLOAD_SIZE_BYTES: int = 5 * 1024 * 1024  # 5MB

settings = Settings()

# Ensure directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(os.path.dirname(settings.CLASSIFIER_MODEL_PATH), exist_ok=True)
