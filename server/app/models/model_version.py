from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from server.app.database.base import Base

class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(100), nullable=False, index=True)  # e.g., 'complaint_classifier', 'embedder', 'ner'
    version = Column(String(50), nullable=False, unique=True, index=True)
    algorithm = Column(String(100), nullable=False)  # e.g., 'TF-IDF + CalibratedLogisticRegression'
    parameters_json = Column(Text, nullable=True)
    metrics_json = Column(Text, nullable=True)  # accuracy, macro_f1, etc.
    artifact_path = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=False, nullable=False)
    trained_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    evaluations = relationship("EvaluationRun", back_populates="model_version", cascade="all, delete-orphan")

class EvaluationRun(Base):
    __tablename__ = "evaluation_runs"

    id = Column(Integer, primary_key=True, index=True)
    model_version_id = Column(Integer, ForeignKey("model_versions.id", ondelete="CASCADE"), nullable=False, index=True)
    dataset_name = Column(String(100), nullable=False)
    sample_count = Column(Integer, nullable=False)
    accuracy = Column(Float, nullable=False)
    macro_f1 = Column(Float, nullable=False)
    precision_weighted = Column(Float, nullable=False)
    recall_weighted = Column(Float, nullable=False)
    confusion_matrix_json = Column(Text, nullable=True)
    classification_report_json = Column(Text, nullable=True)
    run_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    model_version = relationship("ModelVersion", back_populates="evaluations")
