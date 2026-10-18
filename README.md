# CivicPulse — AI Grievance Intelligence Platform

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38b2ac.svg)](https://tailwindcss.com/)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-1.4%2B-F7931E.svg)](https://scikit-learn.org/)
[![SentenceTransformers](https://img.shields.io/badge/SentenceTransformers-all--MiniLM--L6--v2-yellow.svg)](https://sbert.net/)
[![spaCy](https://img.shields.io/badge/spaCy-3.8%2B-09A3D5.svg)](https://spacy.io/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**CivicPulse** is a portfolio-grade, full-stack AI grievance intelligence platform engineered to assist municipal authorities, civic officers, and urban planners in analyzing public grievances. Utilizing Natural Language Processing (NLP), dense sentence embeddings, gazetteer-assisted named-entity recognition (NER), DBSCAN spatio-semantic clustering, and transparent priority scoring, the platform transforms unstructured citizen complaints into structured, actionable municipal intelligence.

---

## 🏛️ System Architecture

```text
                                  +-----------------------------+
                                  |     Citizen / Officer UI    |
                                  |   (React 18 + Vite + Leaflet)|
                                  +--------------+--------------+
                                                 |
                                         REST API / Axios
                                                 v
                                  +-----------------------------+
                                  |       FastAPI Backend       |
                                  |  (Pydantic, Uvicorn, Auth)  |
                                  +--------------+--------------+
                                                 |
               +---------------------------------+--------------------------------+
               |                                 |                                |
               v                                 v                                v
+------------------------------+ +------------------------------+ +------------------------------+
|     AI Module 1: Classifier  | |   AI Module 2: Embeddings    | |  AI Module 3: Location / NER |
| TF-IDF + Calibrated LogReg   | | SentenceTransformers (384-d) | | spaCy NER + Indian Gazetteer |
| (93.9% Acc | 93.3% Macro F1) | | Cosine Semantic Similarity   | | Strict No-Invention Policy   |
+------------------------------+ +------------------------------+ +------------------------------+
               |                                 |                                |
               +---------------------------------+--------------------------------+
                                                 |
                                                 v
                                  +-----------------------------+
                                  | AI Module 4: DBSCAN Cluster |
                                  | Spatio-Temporal & Semantics |
                                  | Extractive Cluster Summary  |
                                  +--------------+--------------+
                                                 |
                                                 v
                                  +-----------------------------+
                                  |  Database & Vector Storage  |
                                  |  PostgreSQL / pgvector OR   |
                                  |  SQLite + Vector Index      |
                                  +-----------------------------+
```

---

## ✨ Key Features

1. **AI Grievance Classification**:
   - Automated categorization across 10 civic domains (*Roads and Potholes, Garbage and Waste, Water Supply, Drainage and Sewage, Streetlights, Public Sanitation, Traffic and Road Safety, Public Infrastructure, Electricity, Other*).
   - Real-world trained classifier with calibrated probability distributions and automatic flagging for human review when confidence is below 35%.

2. **Semantic Similarity & Duplicate Detection**:
   - Dense 384-dimensional sentence embeddings generated via `all-MiniLM-L6-v2` running on CPU.
   - Multi-signal ranking: cosine text similarity, haversine geographic distance in meters, category compatibility, and submission temporal proximity.

3. **Geospatial Intelligence & Location Extraction**:
   - Named-entity recognition (spaCy `en_core_web_sm`) linked with an Indian civic gazetteer of Varanasi localities, crossings, and landmarks (*Lanka crossing, Godowlia, Assi Ghat, Sigra, Pandeypur, Cantt, Bhelupur, Mahmoorganj, etc.*).
   - Strict no-invention coordinate policy: unmapped locations remain marked as unresolved text mentions without arbitrary placement on the map.

4. **Candidate Recurring Issue Clusters (DBSCAN)**:
   - Groups related grievances within geographic radius (<800m) and cosine semantic threshold (<0.35 distance).
   - Generates factual extractive summaries derived directly from citizen complaints without hallucinations.
   - Administrative review controls: confirm, reject, merge, or resolve candidate clusters.

5. **Transparent Explainable Priority Scoring**:
   - Priority scores (0–100) mapped to Low, Medium, High, and Critical tiers based on explicit, inspectable factors: safety hazard indicators, recurring report volume, verified physical coordinates, and baseline category risk.

6. **Full Complaint Lifecycle & Human-in-the-Loop Auditability**:
   - Status progression: `Submitted` → `Under Review` → `Assigned` → `In Progress` → `Resolved` → `Closed`.
   - Officer reclassification tool: allows authorized officers to override AI predictions with mandatory justification, persisting human feedback for future retraining datasets.
   - Immutable audit logs recording all state transitions, reclassifications, and cluster merges.

7. **Civic Operations & Intelligence Dashboard**:
   - Live KPI cards, Recharts time-series trajectory, category volume breakdown, status donut, priority distribution, locality hotspots, and department workloads.
   - Automated data-grounded insights highlighting surges and bottlenecks based on live counts.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS 3.4, React Router 6, Axios, Recharts, Lucide React, Leaflet & React-Leaflet.
- **Backend**: Python 3.10+, FastAPI, Pydantic v2, SQLAlchemy 2.x, Uvicorn, PyJWT, bcrypt.
- **AI / NLP**: Scikit-learn, SentenceTransformers (`all-MiniLM-L6-v2`), spaCy (`en_core_web_sm`), NumPy, Pandas.
- **Database**: PostgreSQL with pgvector support (production / docker) or zero-dependency local SQLite fallback with vector storage.
- **Testing**: Pytest, FastAPI TestClient, HTTPX.

---

## 🚀 Quick Start Guide (Windows)

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Clone & Setup Backend Virtual Environment
```powershell
# Navigate to the project root
cd c:\Users\DELL\Desktop\CivicPulse

# Create Python virtual environment
python -m venv .venv

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Install backend dependencies
pip install -r server\requirements.txt

# Download spaCy English model
python -m spacy download en_core_web_sm
```

### 2. Train AI Classifier & Seed Database
```powershell
# Train the baseline classifier and run evaluation benchmarks
python scripts\train_and_evaluate.py

# Seed the database with departments, users, 131 complaints, and candidate clusters
python scripts\seed_data.py
```

### 3. Setup & Start Frontend
```powershell
# Navigate to client folder
cd client

# Install npm packages
npm install

# Start Vite development server
npm run dev
```
Frontend will be available at: **http://localhost:5173**

### 4. Start Backend Server (in a second terminal)
```powershell
# From project root with .venv activated:
python -m uvicorn server.app.main:app --host 127.0.0.1 --port 8000 --reload
```
Backend API and OpenAPI Swagger documentation available at: **http://127.0.0.1:8000/api/docs**

---

## ⚡ One-Click Startup (PowerShell)
You can launch both backend and frontend with the automated PowerShell script:
```powershell
.\scripts\run_dev.ps1
```

---

## 🔑 Pre-Configured Demo Accounts

For rapid portfolio evaluation, the login screen features **Instant Demo Login** buttons allowing one-click authentication:

| Role | Email | Password | Scope |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@civicpulse.local` | `AdminSecurePass2026!` | Full platform access, user provisioning, model evaluation, audit logs |
| **Civic Officer** | `officer.verma@civicpulse.local` | `OfficerPass2026!` | Review grievances, update status, reclassify AI predictions, confirm clusters |
| **Citizen** | `citizen.priya@civicpulse.local` | `CitizenPass2026!` | Submit complaints, view personal tracking history |

---

## 📊 Measured AI Model Evaluation & Benchmarks

All metrics are measured on real test data and persisted to the database:

| Metric | Measured Score | Evaluation Methodology |
| :--- | :--- | :--- |
| **Classification Accuracy** | **93.94%** | Stratified holdout test set across 10 categories |
| **Macro F1-Score** | **93.33%** | Balanced multi-class F1 metric |
| **Weighted Precision** | **93.94%** | Weighted precision across all classes |
| **Weighted Recall** | **93.94%** | Weighted recall across all classes |
| **Similarity Separation** | **87.5%** | Curated paraphrase vs. unrelated pairs test set |
| **Location Resolution** | **100.0%** | Gazetteer landmark matching & non-invented GPS validation |

---

## 🧪 Automated Pytest Suite

Run the automated test suite covering authentication, validation, AI classification, embeddings, clustering, audit trails, and uploads:

```powershell
python -m pytest server\tests\test_api.py -v
```
**Test Results:** `12 passed in 16.30s (100% pass rate)`

---

## 🐳 Docker Deployment (PostgreSQL + pgvector)

To run the complete production stack with PostgreSQL and pgvector:

```bash
docker-compose up --build
```
- PostgreSQL + pgvector: `localhost:5432`
- FastAPI Backend: `localhost:8000`
- React Frontend: `localhost:5173`

---

## 📁 Repository Structure

```text
CivicPulse/
├── client/                      # React 18 + Vite + Tailwind CSS frontend
│   ├── src/
│   │   ├── api/                 # Axios client and interceptors
│   │   ├── components/
│   │   │   ├── common/          # Badges, StatCards, Modals, Spinners
│   │   │   └── layout/          # Sidebar, Navbar, MainLayout
│   │   ├── context/             # AuthContext with demo quick-logins
│   │   ├── features/
│   │   │   ├── admin/           # AIGovernancePage, AdminPage
│   │   │   ├── clusters/        # ClustersPage (DBSCAN recurring issues)
│   │   │   ├── complaints/      # ComplaintListPage, SubmitPage, DetailPage
│   │   │   ├── dashboard/       # DashboardPage (KPIs, Recharts, Insights)
│   │   │   └── map/             # GeospatialMapPage (Leaflet + overlays)
│   │   ├── utils/               # Constants, colors, coordinates
│   │   ├── App.jsx              # Routes and RBAC wrappers
│   │   └── main.jsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── server/                      # FastAPI Python Backend
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/          # auth, complaints, clusters, map, analytics, admin
│   │   │   └── deps.py          # JWT and role-based dependencies
│   │   ├── core/                # config, security (bcrypt & JWT)
│   │   ├── database/            # session, base
│   │   ├── models/              # User, Complaint, Cluster, Location, Audit, ModelVersion
│   │   ├── schemas/             # Pydantic v2 schemas
│   │   ├── ml/
│   │   │   ├── preprocessing.py # Text sanitization and phone masking
│   │   │   ├── classification.py# TF-IDF + Calibrated Logistic Regression
│   │   │   ├── embeddings.py    # SentenceTransformers all-MiniLM-L6-v2
│   │   │   ├── similarity.py    # Multi-signal cosine and haversine ranking
│   │   │   ├── location_extraction.py # spaCy NER + Indian gazetteer
│   │   │   ├── clustering.py    # DBSCAN spatio-semantic engine
│   │   │   ├── priority.py      # Explainable multi-factor priority scoring
│   │   │   └── routing.py       # Department mapping taxonomy
│   │   └── main.py              # FastAPI application entrypoint
│   ├── tests/                   # Pytest automated test suite
│   ├── Dockerfile
│   └── requirements.txt
├── data/
│   ├── samples/                 # complaints_dataset.json, complaints_seed.json
│   └── README.md                # Dataset origin and synthetic data notice
├── scripts/
│   ├── train_and_evaluate.py    # Model training, benchmark, and DB logging
│   ├── seed_data.py             # Reproducible database seeder
│   └── run_dev.ps1              # Windows one-click startup script
├── docker-compose.yml           # PostgreSQL + pgvector + Backend + Frontend
├── IMPLEMENTATION_STATUS.md     # Implementation progress tracker
├── .env.example
├── .gitignore
└── README.md
```

---

## ⚖️ License
This project is open-source and available under the [MIT License](LICENSE).
