import os
import sys
import json
import argparse
from datetime import datetime

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from server.app.core.config import settings
from server.app.database.session import SessionLocal, engine
from server.app.models import Base, ModelVersion, EvaluationRun
from server.app.ml.classification import classifier_service
from server.app.ml.embeddings import embedding_service
from server.app.ml.location_extraction import location_service
from server.app.ml.similarity import similarity_engine

# Curated test pairs for semantic similarity evaluation
SIMILARITY_TEST_PAIRS = [
    # Positive Paraphrases (should have high cosine similarity >= 0.70)
    {
        "text_a": "There is a huge pothole near Lanka crossing in Varanasi.",
        "text_b": "The road near Lanka junction has a dangerous crater and two-wheelers are slipping.",
        "label": 1,
        "type": "paraphrase"
    },
    {
        "text_a": "Garbage has not been collected for days and is overflowing on Godowlia street.",
        "text_b": "Community trash bin at Godowlia is full of rotten waste and dogs are scattering it.",
        "label": 1,
        "type": "paraphrase"
    },
    {
        "text_a": "Sewer line is clogged and sewage water is spilling into houses in Sigra.",
        "text_b": "Drainage manhole overflowing filthy black water onto Sigra main road.",
        "label": 1,
        "type": "paraphrase"
    },
    {
        "text_a": "Overhead transformer is sparking dangerously and loose wire is hanging.",
        "text_b": "Sparking electrical wires from the transformer pole posing electrocution threat.",
        "label": 1,
        "type": "paraphrase"
    },

    # Negative / Distinct Civic Problems (should have lower similarity < 0.50)
    {
        "text_a": "Streetlights are completely dark on the bypass road.",
        "text_b": "Drinking water tap is running dry with zero water pressure.",
        "label": 0,
        "type": "unrelated_problems"
    },
    {
        "text_a": "Traffic signal is malfunctioning causing vehicle gridlock at Cantt station.",
        "text_b": "Garbage dump is rotting and spreading bad smell near the temple.",
        "label": 0,
        "type": "unrelated_problems"
    },
    {
        "text_a": "Potholes on the road near Lanka crossing.",
        "text_b": "Public toilet in Bhelupur is unhygienic with broken doors.",
        "label": 0,
        "type": "unrelated_problems"
    },
    {
        "text_a": "Public bus shelter shed has broken roof in Shivpur.",
        "text_b": "High voltage wire snapped and fell on the ground.",
        "label": 0,
        "type": "unrelated_problems"
    }
]

# Curated test sentences for Location NER evaluation
LOCATION_TEST_CASES = [
    {
        "text": "Deep pothole near Lanka crossing in Varanasi.",
        "expected_locality": "Lanka",
        "expected_geocoded": True
    },
    {
        "text": "Garbage piled up near Godowlia chowk market.",
        "expected_locality": "Godowlia",
        "expected_geocoded": True
    },
    {
        "text": "Drinking water leakage right outside Assi Ghat entrance.",
        "expected_locality": "Assi",
        "expected_geocoded": True
    },
    {
        "text": "Traffic light stuck at Cantt railway station.",
        "expected_locality": "Cantonment",
        "expected_geocoded": True
    },
    {
        "text": "Pavement damaged near Pandeypur crossing.",
        "expected_locality": "Pandeypur",
        "expected_geocoded": True
    },
    {
        "text": "Streetlight broken in some random unmapped village alley far away.",
        "expected_locality": None,
        "expected_geocoded": False
    }
]

def run_training_and_evaluation(dataset_path: str = "data/samples/complaints_dataset.json"):
    print("=" * 70)
    print("CIVICPULSE AI/NLP PIPELINE TRAINING & EVALUATION BENCHMARK")
    print("=" * 70)

    # 1. Ensure DB tables exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # 2. Load Dataset
    if not os.path.exists(dataset_path):
        print(f"[Error] Dataset not found at {dataset_path}. Run generate_seed.py first.")
        return

    with open(dataset_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    texts = [f"{item['title']} {item['description']}" for item in data]
    labels = [item['category'] for item in data]

    print(f"\n[1/4] Training Classifier Baseline on {len(texts)} complaints across {len(set(labels))} categories...")
    metrics = classifier_service.train(texts, labels, version_tag="1.0.0-tfidf-logreg")

    print(f" -> Training Complete!")
    print(f" -> Accuracy:           {metrics['accuracy'] * 100:.2f}%")
    print(f" -> Macro F1-Score:     {metrics['macro_f1'] * 100:.2f}%")
    print(f" -> Weighted Precision: {metrics['precision_weighted'] * 100:.2f}%")
    print(f" -> Weighted Recall:    {metrics['recall_weighted'] * 100:.2f}%")
    print(f" -> Model Artifact:     {metrics['artifact_path']}")

    # 3. Evaluate Semantic Similarity
    print(f"\n[2/4] Evaluating Semantic Vector Similarity on {len(SIMILARITY_TEST_PAIRS)} benchmark pairs...")
    sim_scores = []
    correct_threshold_predictions = 0
    threshold = settings.SIMILARITY_THRESHOLD

    for pair in SIMILARITY_TEST_PAIRS:
        vec_a = embedding_service.encode(pair["text_a"])
        vec_b = embedding_service.encode(pair["text_b"])
        sim = embedding_service.cosine_similarity(vec_a, vec_b)
        sim_scores.append(sim)
        predicted_match = 1 if sim >= (threshold - 0.15) else 0
        if predicted_match == pair["label"]:
            correct_threshold_predictions += 1
        print(f"   Pair [{pair['type']}]: Sim = {sim:.4f} | Target = {pair['label']} | Pred = {predicted_match}")

    sim_accuracy = correct_threshold_predictions / len(SIMILARITY_TEST_PAIRS)
    print(f" -> Similarity Pair Separation Accuracy: {sim_accuracy * 100:.1f}%")

    # 4. Evaluate Location Extraction
    print(f"\n[3/4] Evaluating Location Extraction on {len(LOCATION_TEST_CASES)} ground-truth sentences...")
    loc_correct = 0
    for case in LOCATION_TEST_CASES:
        resolved = location_service.resolve_primary_location(case["text"])
        locality_match = (resolved["locality"] == case["expected_locality"]) if case["expected_locality"] else (not resolved["has_verified_coordinates"])
        coord_match = (resolved["has_verified_coordinates"] == case["expected_geocoded"])
        is_pass = locality_match and coord_match
        if is_pass:
            loc_correct += 1
        print(f"   Text: \"{case['text'][:40]}...\" -> Found: {resolved['locality']} (coords={resolved['has_verified_coordinates']}) | Pass: {is_pass}")

    loc_accuracy = loc_correct / len(LOCATION_TEST_CASES)
    print(f" -> Location Resolution Accuracy: {loc_accuracy * 100:.1f}%")

    # 5. Persist Model Version & Evaluation Run in Database
    print(f"\n[4/4] Recording Model Governance & Evaluation Run in Database...")
    try:
        # Check if ModelVersion exists or create new
        model_ver = db.query(ModelVersion).filter(ModelVersion.version == "1.0.0-tfidf-logreg").first()
        if not model_ver:
            model_ver = ModelVersion(
                model_name="complaint_classifier",
                version="1.0.0-tfidf-logreg",
                algorithm="TF-IDF (1,2-grams) + Calibrated Logistic Regression",
                parameters_json=json.dumps({"ngram_range": [1, 2], "C": 1.5, "max_iter": 1000}),
                metrics_json=json.dumps({
                    "accuracy": metrics["accuracy"],
                    "macro_f1": metrics["macro_f1"],
                    "precision_weighted": metrics["precision_weighted"],
                    "recall_weighted": metrics["recall_weighted"]
                }),
                artifact_path=metrics["artifact_path"],
                is_active=True
            )
            db.add(model_ver)
            db.commit()
            db.refresh(model_ver)

        # Record Evaluation Run
        eval_run = EvaluationRun(
            model_version_id=model_ver.id,
            dataset_name=os.path.basename(dataset_path),
            sample_count=len(texts),
            accuracy=metrics["accuracy"],
            macro_f1=metrics["macro_f1"],
            precision_weighted=metrics["precision_weighted"],
            recall_weighted=metrics["recall_weighted"],
            confusion_matrix_json=json.dumps(metrics["confusion_matrix"]),
            classification_report_json=json.dumps(metrics["classification_report"]),
            run_at=datetime.utcnow()
        )
        db.add(eval_run)
        db.commit()
        print(f" -> Persisted EvaluationRun ID #{eval_run.id} for ModelVersion '{model_ver.version}'")
    except Exception as e:
        print(f"[Warning] Failed recording evaluation to DB: {e}")
        db.rollback()
    finally:
        db.close()

    print("\n" + "=" * 70)
    print("AI MODEL EVALUATION & GOVERNANCE COMPLETED SUCCESSFULLY")
    print("=" * 70)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="CivicPulse AI Model Training & Evaluation")
    parser.add_argument("--data-source", default="data/samples/complaints_dataset.json", help="Path to complaints JSON/CSV")
    args = parser.parse_args()
    run_training_and_evaluation(args.data_source)
