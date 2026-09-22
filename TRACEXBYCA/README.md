# TRACEX — Dark Web Threat Actor De-Anonymization Platform

**Synthetic Threat Intelligence & Multi-Factor Attribution Platform**  
*Made by Cyber Aurors*

---

## 1. Overview

This platform provides an end-to-end analytical investigative environment designed to de-anonymize cyber threat actors operating across dark web forums, marketplaces, paste sites, and messaging channels.

> [!NOTE]
> **Safety & Ethics Compliance**: To comply with ethical guidelines and ensure 100% deterministic reproducibility during demonstrations and evaluations, the platform operates on a realistic synthetic threat intelligence dataset (`seed=26151`). No live hidden-service scraping or unlawful access is performed.

---

## 2. Core Capabilities

* **Multi-Factor Correlation Engine**: Weighted attribution scoring evaluating cryptographic keys (PGP), cryptocurrency wallet addresses, contact emails, usernames, infrastructure overlaps, stylometry, and activity timing.
* **Persona Migration & Rebrand Detection**: Detects temporal operational shifts where a dormant persona is replaced by a successor persona sharing underlying indicators (e.g., `shadow_x` → `shadow_reborn`).
* **Technical Infrastructure Tracking**: Correlates `.onion` hidden services with clearnet domain mirrors, TLS certificate Common Names, serial fingerprints, server banners, and misconfigurations.
* **Stylometric Fingerprinting**: Pairwise author analysis utilizing TF-IDF bi-grams, vocabulary frequency cosine similarity, sentence length variance, punctuation profiling, and phrase tri-grams.
* **Behavioral & Diurnal Heatmaps**: 24×7 activity matrices (00–23 UTC), platform distribution charts, burst event detection (≥ 2 posts/day), and dormancy gap tracking.
* **Evidentiary Chain & Timeline**: Audit trail linking findings to raw observations with transparent `supporting` vs `contradicting` indicator tagging.
* **Interactive Relationship Graph**: Multi-hop graph canvas powered by `@xyflow/react` (with fallback SQL projection when Neo4j is offline).
* **Investigation Dossier & Report Export**: Export briefing-ready investigation reports in **PDF** (via ReportLab), **CSV**, and **JSON** with embedded disclaimers.

---

## 3. Technology Stack

* **Backend**: Python 3.12–3.14, FastAPI, SQLAlchemy 2, Pydantic v2, Scikit-learn, Scipy, Pandas, ReportLab, Psycopg 3.
* **Frontend**: React 18, TypeScript 5, Vite 6, Tailwind CSS, `@xyflow/react` (ReactFlow), Recharts, Lucide Icons.
* **Database & Graph**: SQLite (default local zero-config store) or PostgreSQL 16; Neo4j 5 Community Edition.

---

## 4. Quickstart Guide (Local Windows Environment)

### Option A: 1-Click Batch Launchers
1. **Start Backend**: Double-click `start_backend.bat` (or run `.\start_backend.bat`). Starts FastAPI on `http://127.0.0.1:8000`.
2. **Start Frontend**: Double-click `start_frontend.bat` (or run `.\start_frontend.bat`). Starts Vite dev server on `http://localhost:5173`.
3. Open `http://localhost:5173` in your browser.

### Option B: Manual Command Line Execution

#### 1. Backend Setup
```powershell
# Create & activate virtual environment
python -m venv backend\.venv
backend\.venv\Scripts\pip.exe install -r backend\requirements.txt

# Launch FastAPI backend
cd backend
..\backend\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### 2. Frontend Setup
```powershell
cd frontend
npm install
npm run dev
```

### Option C: Docker Compose (Full Stack)
```bash
docker-compose up --build
```
* Frontend: `http://localhost:8080`
* Backend API: `http://localhost:8000/api`
* Neo4j Browser: `http://localhost:7474`

---

## 5. Demonstration Flow

1. **Dashboard**: Navigate to `/` to view collection metrics, active cases, and recent threat activity. Click **Demo Investigation**.
2. **Investigation Workspace**: View the pre-configured case `INV-DEMO-001` (*Nexus Rebrand — shadow_x / shadow_reborn*).
   * **Correlations Tab**: Inspect calculated attribution confidence (`HIGH`), supporting evidence counts, and contradiction penalties.
   * **Infrastructure Tab**: Review linked onion addresses, clearnet domain mirrors, and TLS certificate anomalies.
   * **Stylometry Tab**: Compare writing styles between the primary subject and correlation candidates.
   * **Behaviour Tab**: Inspect the diurnal heatmap, platform activity distribution, and migration alerts.
   * **Graph Tab**: Explore the multi-hop entity relationship network.
   * **Reports Tab**: Click **Download PDF** to export the investigation dossier.
3. **Omni Search**: Use the top navigation search bar to search for any identifier (e.g., `shadow_x`, `SYNTH-001`, or `.onion`).

---

## 6. Testing & Validation

Run the automated integration and smoke test suite:
```powershell
backend\.venv\Scripts\python.exe backend\smoke_test.py
```
This tests 14 distinct functional flows:
* Database schema creation & dataset seeding
* API health & dashboard metrics
* Case creation & demo case resolution
* Actor catalogue & search
* Profile dossier assembly
* Multi-factor correlation calculations
* Infrastructure anomaly retrieval
* Pairwise stylometric author analysis
* Diurnal behavioral heatmap calculations & persona migration detection
* Evidence chains & chronological timelines
* Graph projection & Neo4j sync
* Report compilation and PDF/CSV/JSON export
* Omni search & heuristic weight retrieval

