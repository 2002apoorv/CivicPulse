import os
import joblib
import numpy as np
from typing import Dict, Any, List, Optional, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, f1_score, precision_recall_fscore_support, confusion_matrix, classification_report
from server.app.core.config import settings
from server.app.models.complaint import CivicCategory
from server.app.ml.preprocessing import clean_text, preprocess_for_classification

CIVIC_CATEGORIES = [c.value for c in CivicCategory]

# Domain-specific keyword heuristics for reliable fallback and explainability
KEYWORD_ASSOCIATIONS = {
    CivicCategory.ROADS_AND_POTHOLES.value: [
        "pothole", "potholes", "crater", "road", "highway", "asphalt", "tar", "macadam", 
        "roadway", "speed breaker", "divider", "pavement", "broken road", "swerve"
    ],
    CivicCategory.GARBAGE_AND_WASTE.value: [
        "garbage", "trash", "waste", "dump", "debris", "litter", "rubbish", "refuse",
        "dustbin", "overflowing bin", "dumpster", "filth", "dead animal", "uncollected waste"
    ],
    CivicCategory.WATER_SUPPLY.value: [
        "water", "tap", "pipeline", "pipe leak", "water supply", "drinking water",
        "low pressure", "contaminated water", "dirty water", "no water", "water shortage"
    ],
    CivicCategory.DRAINAGE_AND_SEWAGE.value: [
        "drain", "drainage", "sewage", "sewer", "gutter", "clogged drain", "manhole",
        "stagnant water", "waterlogging", "overflowing sewer", "foul smell", "cesspool"
    ],
    CivicCategory.STREETLIGHTS.value: [
        "streetlight", "street light", "lamp post", "pole light", "dark street",
        "flickering light", "bulb broken", "no light", "darkness", "street lamp"
    ],
    CivicCategory.PUBLIC_SANITATION.value: [
        "toilet", "public toilet", "urinal", "sanitation", "unhygienic", "defecation",
        "restroom", "stink", "sanitary", "washroom", "cleanliness"
    ],
    CivicCategory.TRAFFIC_AND_SAFETY.value: [
        "traffic", "signal", "traffic light", "jam", "congestion", "signal not working",
        "rash driving", "parking", "encroachment", "pedestrian crossing", "zebra crossing", "accident prone"
    ],
    CivicCategory.PUBLIC_INFRASTRUCTURE.value: [
        "footpath", "sidewalk", "bridge", "flyover", "bus stop", "bench", "park",
        "railing", "boundary wall", "public building", "subway", "compound"
    ],
    CivicCategory.ELECTRICITY.value: [
        "electricity", "power cut", "transformer", "wire", "hanging wire", "loose wire",
        "spark", "sparking", "short circuit", "voltage", "meter", "current", "electric shock"
    ],
    CivicCategory.OTHER.value: [
        "general", "miscellaneous", "other", "inquiry", "civic", "staff", "behavior"
    ]
}

class ComplaintClassifier:
    """Production NLP classifier for Civic Grievances with TF-IDF, Calibrated Logistic Regression, and Heuristic Fallbacks."""

    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path or settings.CLASSIFIER_MODEL_PATH
        self.model: Optional[Pipeline] = None
        self.version = "1.0.0-baseline-tfidf-logreg"
        self._load_if_exists()

    def _load_if_exists(self) -> bool:
        if os.path.exists(self.model_path):
            try:
                loaded_data = joblib.load(self.model_path)
                if isinstance(loaded_data, dict):
                    self.model = loaded_data.get("pipeline")
                    self.version = loaded_data.get("version", self.version)
                else:
                    self.model = loaded_data
                return True
            except Exception as e:
                print(f"[Warning] Failed loading model artifact at {self.model_path}: {e}")
        return False

    def predict(self, text: str) -> Dict[str, Any]:
        """Predict the category of a grievance with confidence and probability distribution."""
        cleaned = clean_text(text)
        preprocessed = preprocess_for_classification(cleaned)

        if self.model is not None:
            try:
                # Scikit-learn pipeline inference
                probs = self.model.predict_proba([preprocessed])[0]
                classes = self.model.classes_

                class_probs = {str(c): float(p) for c, p in zip(classes, probs)}
                top_class = str(max(class_probs, key=class_probs.get))
                confidence = float(class_probs[top_class])

                requires_review = bool(confidence < settings.CONFIDENCE_REVIEW_THRESHOLD)

                return {
                    "predicted_category": top_class,
                    "confidence": round(confidence, 4),
                    "probabilities": {str(k): round(float(v), 4) for k, v in class_probs.items()},
                    "model_version": str(self.version),
                    "requires_human_review": requires_review,
                    "explanation": f"Model assigned {top_class} with {round(confidence * 100, 1)}% confidence based on n-gram feature activations."
                }
            except Exception as e:
                print(f"[Warning] ML Model prediction failed, falling back to heuristics: {e}")

        # Fallback to rule-based keyword match when model artifact is not yet trained
        return self._heuristic_predict(text)

    def _heuristic_predict(self, text: str) -> Dict[str, Any]:
        """High-precision keyword matching fallback."""
        lowered = text.lower()
        scores = {}
        for cat, keywords in KEYWORD_ASSOCIATIONS.items():
            score = 0.0
            for kw in keywords:
                if kw in lowered:
                    score += 1.0 + (0.5 if len(kw.split()) > 1 else 0.0)
            scores[cat] = score

        total = sum(scores.values())
        if total == 0:
            probs = {cat: 0.1 for cat in CIVIC_CATEGORIES}
            return {
                "predicted_category": CivicCategory.OTHER.value,
                "confidence": 0.35,
                "probabilities": probs,
                "model_version": "0.1.0-keyword-fallback",
                "requires_human_review": True,
                "explanation": "No distinct category keywords matched. Defaulted to Other with low confidence (human review recommended)."
            }

        probs = {cat: round(scores[cat] / total, 4) for cat in CIVIC_CATEGORIES}
        top_cat = max(probs, key=probs.get)
        confidence = probs[top_cat]
        # Boost confidence when multiple keywords match
        if scores[top_cat] >= 2:
            confidence = min(0.88, confidence + 0.15)

        return {
            "predicted_category": top_cat,
            "confidence": round(confidence, 4),
            "probabilities": probs,
            "model_version": "0.1.0-keyword-fallback",
            "requires_human_review": confidence < settings.CONFIDENCE_REVIEW_THRESHOLD,
            "explanation": f"Keyword heuristic match detected keywords strongly indicating {top_cat}."
        }

    def train(self, texts: List[str], labels: List[str], version_tag: str = "1.0.0-baseline-tfidf-logreg") -> Dict[str, Any]:
        """Train or retrain the classifier pipeline with train/test evaluation split."""
        from sklearn.model_selection import train_test_split

        clean_texts = [preprocess_for_classification(t) for t in texts]

        X_train, X_val, y_train, y_val = train_test_split(
            clean_texts, labels, test_size=0.25, random_state=42, stratify=labels
        )

        pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(ngram_range=(1, 2), max_features=5000, sublinear_tf=True)),
            ('clf', LogisticRegression(C=1.5, class_weight='balanced', max_iter=1000, random_state=42))
        ])

        pipeline.fit(X_train, y_train)
        self.model = pipeline
        self.version = version_tag

        # Evaluate on validation split
        y_pred = pipeline.predict(X_val)
        y_prob = pipeline.predict_proba(X_val)

        acc = float(accuracy_score(y_val, y_pred))
        macro_f1 = float(f1_score(y_val, y_pred, average='macro', zero_division=0))
        prec, rec, f1, _ = precision_recall_fscore_support(y_val, y_pred, average='weighted', zero_division=0)

        classes = list(pipeline.classes_)
        cm = confusion_matrix(y_val, y_pred, labels=classes).tolist()
        report = classification_report(y_val, y_pred, labels=classes, output_dict=True, zero_division=0)

        # Save artifact
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        joblib.dump({"pipeline": pipeline, "version": version_tag, "classes": classes}, self.model_path)

        return {
            "accuracy": round(acc, 4),
            "macro_f1": round(macro_f1, 4),
            "precision_weighted": round(float(prec), 4),
            "recall_weighted": round(float(rec), 4),
            "confusion_matrix": cm,
            "labels": classes,
            "classification_report": report,
            "train_samples": len(X_train),
            "val_samples": len(X_val),
            "artifact_path": self.model_path
        }

    def evaluate(self, texts: List[str], labels: List[str]) -> Dict[str, Any]:
        """Evaluate the active model on an external test set."""
        if self.model is None:
            raise ValueError("No trained model loaded for evaluation.")
        clean_texts = [preprocess_for_classification(t) for t in texts]
        y_pred = self.model.predict(clean_texts)
        classes = list(self.model.classes_)

        acc = float(accuracy_score(labels, y_pred))
        macro_f1 = float(f1_score(labels, y_pred, average='macro', zero_division=0))
        prec, rec, f1, _ = precision_recall_fscore_support(labels, y_pred, average='weighted', zero_division=0)
        cm = confusion_matrix(labels, y_pred, labels=classes).tolist()
        report = classification_report(labels, y_pred, labels=classes, output_dict=True, zero_division=0)

        return {
            "accuracy": round(acc, 4),
            "macro_f1": round(macro_f1, 4),
            "precision_weighted": round(float(prec), 4),
            "recall_weighted": round(float(rec), 4),
            "confusion_matrix": cm,
            "labels": classes,
            "classification_report": report,
            "sample_count": len(texts)
        }

classifier_service = ComplaintClassifier()
