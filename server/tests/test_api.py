import pytest
import os
import io
import json
from datetime import datetime
from fastapi.testclient import TestClient
from server.app.main import app
from server.app.core.config import settings
from server.app.database.session import SessionLocal
from server.app.models.user import User, UserRole
from server.app.models.complaint import Complaint, ComplaintStatus, PriorityLevel
from server.app.models.cluster import ComplaintCluster, ClusterStatus
from server.app.ml.classification import classifier_service
from server.app.ml.location_extraction import location_service
from server.app.ml.embeddings import embedding_service
from server.app.ml.similarity import similarity_engine

client = TestClient(app)

@pytest.fixture(scope="session")
def admin_token():
    resp = client.post("/api/v1/auth/login", json={
        "email": settings.BOOTSTRAP_ADMIN_EMAIL,
        "password": settings.BOOTSTRAP_ADMIN_PASSWORD
    })
    assert resp.status_code == 200, f"Admin login failed: {resp.text}"
    return resp.json()["access_token"]

@pytest.fixture(scope="session")
def officer_token():
    resp = client.post("/api/v1/auth/login", json={
        "email": "officer.verma@civicpulse.local",
        "password": "OfficerPass2026!"
    })
    assert resp.status_code == 200, f"Officer login failed: {resp.text}"
    return resp.json()["access_token"]

@pytest.fixture(scope="session")
def citizen_token():
    resp = client.post("/api/v1/auth/login", json={
        "email": "citizen.priya@civicpulse.local",
        "password": "CitizenPass2026!"
    })
    assert resp.status_code == 200, f"Citizen login failed: {resp.text}"
    return resp.json()["access_token"]

# 1. User registration and login
def test_user_registration_and_login():
    test_email = f"test.user.{int(datetime.utcnow().timestamp())}@civicpulse.org"
    # Registration
    reg_resp = client.post("/api/v1/auth/register", json={
        "email": test_email,
        "password": "SecretTestPass123!",
        "full_name": "Test Citizen",
        "phone_number": "+91 98765 11111"
    })
    assert reg_resp.status_code == 201
    assert "access_token" in reg_resp.json()
    assert reg_resp.json()["user"]["role"] == "citizen"

    # Login
    login_resp = client.post("/api/v1/auth/login", json={
        "email": test_email,
        "password": "SecretTestPass123!"
    })
    assert login_resp.status_code == 200
    assert "access_token" in login_resp.json()

# 2. Unauthorized requests are rejected
def test_unauthorized_requests_rejected():
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code == 401

    resp_admin = client.get("/api/v1/admin/users")
    assert resp_admin.status_code == 401

# 3. Citizens cannot access other citizens' private complaints or admin routes
def test_citizen_access_control(citizen_token):
    # Citizen trying to access admin users endpoint
    resp = client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {citizen_token}"})
    assert resp.status_code == 403

# 4 & 5. Complaint submission & validation
def test_complaint_submission_and_validation(citizen_token):
    # Invalid input (too short)
    bad_resp = client.post("/api/v1/complaints", json={
        "title": "Hi",
        "description": "Short"
    }, headers={"Authorization": f"Bearer {citizen_token}"})
    assert bad_resp.status_code == 422

    # Valid submission
    valid_resp = client.post("/api/v1/complaints", json={
        "title": "Severe road pothole near Lanka crossing",
        "description": "A very large pothole has opened up near Lanka crossing in Varanasi. Bikes are slipping every evening.",
        "location_text": "Lanka crossing",
        "city": "Varanasi"
    }, headers={"Authorization": f"Bearer {citizen_token}"})
    assert valid_resp.status_code == 201
    data = valid_resp.json()
    assert data["reference_no"].startswith("CP-2026-")
    assert data["ai_predicted_category"] == "Roads and Potholes"
    assert data["ai_confidence"] > 0.15
    assert data["has_verified_coordinates"] == True
    assert data["latitude"] is not None
    assert data["longitude"] is not None

# 6 & 7. AI Module 1: Classification & human review thresholding
def test_classification_and_review_trigger():
    # Clear categorical complaint
    clear_complaint = "Streetlight is completely broken on the corner and the pole bulb is dark."
    pred_clear = classifier_service.predict(clear_complaint)
    assert pred_clear["predicted_category"] == "Streetlights"
    assert pred_clear["confidence"] > 0.15
    assert "probabilities" in pred_clear

    # Ambiguous complaint (triggers human review)
    ambiguous_text = "Something unusual is happening on the avenue."
    pred_ambig = classifier_service.predict(ambiguous_text)
    assert pred_ambig["requires_human_review"] == True

# 8 & 9. AI Module 2: Semantic Similarity
def test_semantic_similarity():
    paraphrase_1 = "There is a huge pothole near Lanka crossing."
    paraphrase_2 = "The road near Lanka has a dangerous crater and two-wheelers are struggling."
    unrelated = "Water tap has zero water pressure in Assi colony."

    vec_1 = embedding_service.encode(paraphrase_1)
    vec_2 = embedding_service.encode(paraphrase_2)
    vec_unrelated = embedding_service.encode(unrelated)

    sim_paraphrase = embedding_service.cosine_similarity(vec_1, vec_2)
    sim_unrelated = embedding_service.cosine_similarity(vec_1, vec_unrelated)

    assert sim_paraphrase > sim_unrelated
    assert sim_paraphrase > 0.45

# 10. AI Module 3: Location Extraction (no coordinate invention)
def test_location_extraction_no_invented_coordinates():
    # Known locality in gazetteer
    loc_known = location_service.resolve_primary_location("Pothole near Lanka crossing in Varanasi")
    assert loc_known["has_verified_coordinates"] == True
    assert loc_known["latitude"] == 25.2798

    # Unmapped location mention (must NOT invent coordinates)
    loc_unmapped = location_service.resolve_primary_location("Defective lamp in some fictitious unknown alleyway")
    assert loc_unmapped["has_verified_coordinates"] == False
    assert loc_unmapped["latitude"] is None
    assert loc_unmapped["longitude"] is None

# 11 & 12. Recurring Issue Clusters and management
def test_cluster_endpoints(officer_token):
    # List clusters
    list_resp = client.get("/api/v1/clusters", headers={"Authorization": f"Bearer {officer_token}"})
    assert list_resp.status_code == 200
    clusters = list_resp.json()
    assert len(clusters) > 0

    target_cluster = clusters[0]
    detail_resp = client.get(f"/api/v1/clusters/{target_cluster['id']}", headers={"Authorization": f"Bearer {officer_token}"})
    assert detail_resp.status_code == 200
    assert "members" in detail_resp.json()

# 13. Complaint Status lifecycle & Audit History
def test_complaint_status_transition_and_audit(officer_token, citizen_token):
    # Create complaint
    create_resp = client.post("/api/v1/complaints", json={
        "title": "Overflowing waste dumpster near Godowlia",
        "description": "Garbage container is overflowing with rotting vegetable waste.",
        "locality": "Godowlia"
    }, headers={"Authorization": f"Bearer {citizen_token}"})
    comp_id = create_resp.json()["id"]

    # Officer updates status
    patch_resp = client.patch(
        f"/api/v1/complaints/{comp_id}/status",
        json={"status": "in_progress", "notes": "Sanitation crew truck dispatched to location."},
        headers={"Authorization": f"Bearer {officer_token}"}
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["status"] == "in_progress"

    # Detail includes status history
    detail_resp = client.get(f"/api/v1/complaints/{comp_id}", headers={"Authorization": f"Bearer {officer_token}"})
    assert detail_resp.status_code == 200
    histories = detail_resp.json()["status_history"]
    assert any(h["new_status"] == "in_progress" for h in histories)

# 14 & 15. Dashboard metrics & Filters
def test_dashboard_metrics_and_trends(citizen_token):
    resp = client.get("/api/v1/analytics/summary", headers={"Authorization": f"Bearer {citizen_token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_complaints"] > 0
    assert "resolution_rate_percent" in data

    trend_resp = client.get("/api/v1/analytics/trends?days=14", headers={"Authorization": f"Bearer {citizen_token}"})
    assert trend_resp.status_code == 200
    assert len(trend_resp.json()) > 0

# 16. Map endpoints return only verified coordinate complaints
def test_map_endpoint_filters_valid_coordinates(citizen_token):
    map_resp = client.get("/api/v1/map/complaints", headers={"Authorization": f"Bearer {citizen_token}"})
    assert map_resp.status_code == 200
    data = map_resp.json()
    for point in data["complaints"]:
        assert point["latitude"] is not None
        assert point["longitude"] is not None
        assert isinstance(point["latitude"], (int, float))

# 17. Safe File Upload restrictions
def test_file_upload_restrictions(officer_token, citizen_token):
    create_resp = client.post("/api/v1/complaints", json={
        "title": "Water leakage tap in Assi",
        "description": "Drinking water tap is running continuously.",
        "locality": "Assi"
    }, headers={"Authorization": f"Bearer {citizen_token}"})
    comp_id = create_resp.json()["id"]

    # Invalid file type (.exe)
    fake_exe = io.BytesIO(b"MZ executable header")
    bad_upload = client.post(
        f"/api/v1/complaints/{comp_id}/attachments",
        files={"file": ("malware.exe", fake_exe, "application/x-dosexec")},
        headers={"Authorization": f"Bearer {citizen_token}"}
    )
    assert bad_upload.status_code == 400

    # Valid image upload (.png)
    valid_png = io.BytesIO(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR...")
    good_upload = client.post(
        f"/api/v1/complaints/{comp_id}/attachments",
        files={"file": ("evidence.png", valid_png, "image/png")},
        headers={"Authorization": f"Bearer {citizen_token}"}
    )
    assert good_upload.status_code == 200
    assert "file_path" in good_upload.json()
