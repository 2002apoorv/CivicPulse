import os
import sys
import json
from datetime import datetime, timedelta

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from server.app.core.config import settings
from server.app.core.security import get_password_hash
from server.app.database.session import SessionLocal, engine
from server.app.models import (
    Base, User, UserRole, Department, Complaint, ComplaintStatus,
    PriorityLevel, ComplaintClassification, ComplaintLocation,
    ComplaintCluster, ClusterMembership, ClusterStatus,
    ComplaintStatusHistory, AuditLog
)
from server.app.ml.routing import INITIAL_DEPARTMENTS, suggest_department_for_category
from server.app.ml.classification import classifier_service
from server.app.ml.embeddings import embedding_service
from server.app.ml.location_extraction import location_service
from server.app.ml.priority import calculate_priority_score
from server.app.ml.clustering import clustering_engine

DEFAULT_USERS = [
    {
        "email": settings.BOOTSTRAP_ADMIN_EMAIL,
        "password": settings.BOOTSTRAP_ADMIN_PASSWORD,
        "full_name": settings.BOOTSTRAP_ADMIN_NAME,
        "role": UserRole.ADMIN,
        "phone_number": "+91 98765 00001",
        "dept_code": None
    },
    {
        "email": "officer.verma@civicpulse.local",
        "password": "OfficerPass2026!",
        "full_name": "Ramesh Verma (Chief Road & Drainage Officer)",
        "role": UserRole.OFFICER,
        "phone_number": "+91 98765 00002",
        "dept_code": "ROAD_MAINT"
    },
    {
        "email": "officer.singh@civicpulse.local",
        "password": "OfficerPass2026!",
        "full_name": "Dr. Anjali Singh (Sanitation Commissioner)",
        "role": UserRole.OFFICER,
        "phone_number": "+91 98765 00003",
        "dept_code": "SANITATION"
    },
    {
        "email": "citizen.priya@civicpulse.local",
        "password": "CitizenPass2026!",
        "full_name": "Priya Sharma (Resident)",
        "role": UserRole.CITIZEN,
        "phone_number": "+91 98765 00004",
        "dept_code": None
    },
    {
        "email": "citizen.rahul@civicpulse.local",
        "password": "CitizenPass2026!",
        "full_name": "Rahul Mishra (Resident)",
        "role": UserRole.CITIZEN,
        "phone_number": "+91 98765 00005",
        "dept_code": None
    }
]

def seed_database():
    print("=" * 65)
    print("CIVICPULSE DATABASE SEEDING ENGINE")
    print("=" * 65)

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Seed Departments
        print("\n[1/5] Seeding Initial Municipal Departments...")
        dept_lookup = {}
        for d_info in INITIAL_DEPARTMENTS:
            dept = db.query(Department).filter(Department.code == d_info["code"]).first()
            if not dept:
                dept = Department(
                    name=d_info["name"],
                    code=d_info["code"],
                    description=d_info["description"],
                    contact_email=d_info["contact_email"],
                    is_active=True
                )
                db.add(dept)
                db.flush()
                print(f" -> Created Department: {dept.name} ({dept.code})")
            dept_lookup[dept.code] = dept
        db.commit()

        # 2. Seed Default Users
        print("\n[2/5] Seeding System Administrative, Officer, and Citizen Users...")
        user_lookup = {}
        for u_info in DEFAULT_USERS:
            user = db.query(User).filter(User.email == u_info["email"]).first()
            dept_id = dept_lookup[u_info["dept_code"]].id if u_info["dept_code"] and u_info["dept_code"] in dept_lookup else None
            if not user:
                user = User(
                    email=u_info["email"],
                    hashed_password=get_password_hash(u_info["password"]),
                    full_name=u_info["full_name"],
                    role=u_info["role"],
                    phone_number=u_info["phone_number"],
                    department_id=dept_id,
                    is_active=True
                )
                db.add(user)
                db.flush()
                print(f" -> Created User: {user.full_name} [{user.role.value}] ({user.email})")
            user_lookup[user.email] = user
        db.commit()

        # 3. Seed Complaints
        print("\n[3/5] Seeding Complaints with Live AI Extraction, Classification, and Embeddings...")
        complaint_count = db.query(Complaint).count()
        if complaint_count > 0:
            print(f" -> Database already contains {complaint_count} complaints. Skipping complaint re-insertion to maintain idempotency.")
        else:
            seed_file = os.path.join(os.path.dirname(__file__), "..", "data", "samples", "complaints_dataset.json")
            if not os.path.exists(seed_file):
                seed_file = os.path.join(os.path.dirname(__file__), "..", "data", "samples", "complaints_seed.json")

            with open(seed_file, "r", encoding="utf-8") as f:
                raw_complaints = json.load(f)

            citizen_users = [u for u in user_lookup.values() if u.role == UserRole.CITIZEN]
            admin_user = user_lookup[settings.BOOTSTRAP_ADMIN_EMAIL]
            officer_user = user_lookup["officer.verma@civicpulse.local"]

            complaint_entities = []

            for idx, c_raw in enumerate(raw_complaints, start=1):
                citizen = citizen_users[idx % len(citizen_users)]
                title = c_raw["title"]
                desc = c_raw["description"]
                text_combined = f"{title} {desc}"

                # AI Module 1: Classification
                pred_result = classifier_service.predict(text_combined)
                ai_category = pred_result["predicted_category"]
                ai_conf = pred_result["confidence"]
                requires_review = pred_result["requires_human_review"]

                # Assigned category: use ground truth or AI prediction
                canonical_category = c_raw.get("category", ai_category)

                # AI Module 3: Location Extraction
                user_lat = c_raw.get("latitude")
                user_lon = c_raw.get("longitude")
                loc_res = location_service.resolve_primary_location(
                    text=text_combined,
                    user_lat=user_lat,
                    user_lon=user_lon,
                    user_locality=c_raw.get("locality")
                )

                # AI Module 2: Embedding
                emb_vec = embedding_service.encode(text_combined)
                emb_json = embedding_service.serialize_embedding(emb_vec)

                # Routing: Department
                dept = suggest_department_for_category(canonical_category, db)

                # Priority Scoring
                status_str = c_raw.get("status", "submitted")
                try:
                    comp_status = ComplaintStatus(status_str)
                except Exception:
                    comp_status = ComplaintStatus.SUBMITTED

                priority_lvl, priority_sc, priority_rsn = calculate_priority_score(
                    title=title,
                    description=desc,
                    category=canonical_category,
                    related_complaint_count=idx % 3,
                    has_verified_location=loc_res["has_verified_coordinates"]
                )

                # Timestamps
                days_ago = c_raw.get("days_ago", 5)
                created_dt = datetime.utcnow() - timedelta(days=days_ago, hours=idx % 12)
                resolved_dt = (created_dt + timedelta(days=2)) if comp_status in (ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED) else None

                ref_no = f"CP-2026-{idx:05d}"

                complaint = Complaint(
                    reference_no=ref_no,
                    title=title,
                    description=desc,
                    citizen_id=citizen.id,
                    category=canonical_category,
                    user_selected_category=c_raw.get("category"),
                    ai_predicted_category=ai_category,
                    ai_confidence=ai_conf,
                    requires_human_review=requires_review,
                    status=comp_status,
                    priority=priority_lvl,
                    priority_score=priority_sc,
                    priority_reason=priority_rsn,
                    assigned_department_id=dept.id if dept else None,
                    assigned_officer_id=officer_user.id if comp_status in (ComplaintStatus.ASSIGNED, ComplaintStatus.IN_PROGRESS, ComplaintStatus.RESOLVED) else None,
                    location_text=loc_res.get("locality"),
                    locality=loc_res.get("locality") or c_raw.get("locality"),
                    ward=loc_res.get("ward") or c_raw.get("ward"),
                    city="Varanasi",
                    latitude=loc_res.get("latitude"),
                    longitude=loc_res.get("longitude"),
                    has_verified_coordinates=loc_res.get("has_verified_coordinates", False),
                    embedding=emb_json,
                    created_at=created_dt,
                    updated_at=created_dt,
                    resolved_at=resolved_dt
                )
                db.add(complaint)
                db.flush()

                # Add classification history
                cls_record = ComplaintClassification(
                    complaint_id=complaint.id,
                    predicted_category=ai_category,
                    confidence=ai_conf,
                    model_version=pred_result["model_version"],
                    top_probabilities_json=json.dumps(pred_result["probabilities"]),
                    created_at=created_dt
                )
                db.add(cls_record)

                # Add extracted location entities
                extracted_entities = location_service.extract_locations(text_combined)
                for ent in extracted_entities:
                    loc_entity = ComplaintLocation(
                        complaint_id=complaint.id,
                        raw_mention=ent["raw_mention"],
                        entity_type=ent["entity_type"],
                        normalized_name=ent["normalized_name"],
                        latitude=ent["latitude"],
                        longitude=ent["longitude"],
                        confidence=ent["confidence"],
                        is_geocoded=ent["is_geocoded"],
                        resolution_source=ent["resolution_source"],
                        created_at=created_dt
                    )
                    db.add(loc_entity)

                # Add status history
                history = ComplaintStatusHistory(
                    complaint_id=complaint.id,
                    previous_status=None,
                    new_status=comp_status.value,
                    changed_by_id=admin_user.id,
                    notes="Complaint registered into CivicPulse system.",
                    created_at=created_dt
                )
                db.add(history)

                # Add initial audit log
                audit = AuditLog(
                    entity_type="complaint",
                    entity_id=complaint.id,
                    action="create",
                    performed_by_id=citizen.id,
                    changes_json=json.dumps({"reference_no": ref_no, "title": title, "category": canonical_category}),
                    created_at=created_dt
                )
                db.add(audit)

                complaint_entities.append(complaint)

            db.commit()
            print(f" -> Successfully processed and persisted {len(complaint_entities)} complaints!")

        # 4. Form Candidate Clusters
        print("\n[4/5] Running Spatio-Temporal and Semantic Clustering Engine...")
        all_complaints = db.query(Complaint).all()
        complaint_dicts = []
        for c in all_complaints:
            complaint_dicts.append({
                "id": c.id,
                "title": c.title,
                "description": c.description,
                "category": c.category,
                "locality": c.locality,
                "latitude": c.latitude,
                "longitude": c.longitude,
                "embedding": c.embedding,
                "created_at": c.created_at,
                "assigned_department_id": c.assigned_department_id
            })

        existing_clusters_count = db.query(ComplaintCluster).count()
        if existing_clusters_count == 0:
            candidate_clusters = clustering_engine.detect_clusters(complaint_dicts)
            print(f" -> Discovered {len(candidate_clusters)} candidate recurring issue clusters.")

            for cluster_info in candidate_clusters:
                db_cluster = ComplaintCluster(
                    cluster_code=cluster_info["cluster_code"],
                    title=cluster_info["title"],
                    category=cluster_info["category"],
                    summary=cluster_info["summary"],
                    representative_complaint_id=cluster_info["representative_complaint_id"],
                    complaint_count=cluster_info["complaint_count"],
                    first_reported_at=cluster_info["first_reported_at"],
                    latest_reported_at=cluster_info["latest_reported_at"],
                    centroid_lat=cluster_info["centroid_lat"],
                    centroid_lon=cluster_info["centroid_lon"],
                    spread_radius_meters=cluster_info["spread_radius_meters"],
                    status=cluster_info["status"],
                    priority_score=cluster_info["priority_score"],
                    assigned_department_id=cluster_info["assigned_department_id"],
                    is_human_verified=False,
                    created_at=cluster_info["first_reported_at"],
                    updated_at=cluster_info["latest_reported_at"]
                )
                db.add(db_cluster)
                db.flush()

                # Add memberships and link complaints
                for m in cluster_info["members"]:
                    comp_id = m["complaint_id"]
                    membership = ClusterMembership(
                        cluster_id=db_cluster.id,
                        complaint_id=comp_id,
                        similarity_to_centroid=m["similarity_to_centroid"],
                        is_manually_assigned=False,
                        added_at=datetime.utcnow()
                    )
                    db.add(membership)

                    # Update complaint's cluster_id
                    comp = db.query(Complaint).filter(Complaint.id == comp_id).first()
                    if comp:
                        comp.cluster_id = db_cluster.id

            db.commit()
            print(f" -> Persisted {len(candidate_clusters)} clusters with member linkages.")
        else:
            print(f" -> Clusters already exist ({existing_clusters_count} clusters). Skipping.")

        # 5. Verification summary
        total_users = db.query(User).count()
        total_depts = db.query(Department).count()
        total_comps = db.query(Complaint).count()
        total_clusters = db.query(ComplaintCluster).count()

        print("\n[5/5] Database Verification:")
        print(f"   • Total Departments: {total_depts}")
        print(f"   • Total Users:       {total_users}")
        print(f"   • Total Complaints:  {total_comps}")
        print(f"   • Active Clusters:   {total_clusters}")
        print("\n" + "=" * 65)
        print("DATABASE SEEDING COMPLETED SUCCESSFULLY!")
        print("=" * 65)

    except Exception as e:
        print(f"[Error] Seeding failed: {e}")
        db.rollback()
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
