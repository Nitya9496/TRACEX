"""Comprehensive API smoke tests for SIH PS 26151 backend MVP."""
import sys
from pathlib import Path

# Add backend directory to sys.path
BACKEND_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_DIR))

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, Base, engine
from app.services.seed import seed_if_empty
from app.reports.generator import build_report, to_pdf, to_csv

def run_tests():
    print("=== STARTING BACKEND SMOKE TESTS ===")
    
    # 1. Test database initialization & seeding
    print("\n1. Testing Database & Seed...")
    db = SessionLocal()
    try:
        seed_if_empty(db)
        print("   Database schema created and seed data verified.")
    finally:
        db.close()
        
    client = TestClient(app)
    
    # 2. Health check
    print("\n2. Testing /health...")
    res = client.get("/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print(f"   Health check OK: {res.json()}")
    
    # 3. Dashboard endpoint
    print("\n3. Testing /api/dashboard...")
    res = client.get("/api/dashboard")
    assert res.status_code == 200, f"Dashboard failed: {res.text}"
    dash = res.json()
    assert dash["threat_actor_profiles"] > 0, "No actors in dashboard"
    assert dash["evidence_items"] > 0, "No evidence in dashboard"
    print(f"   Dashboard OK: {dash['threat_actor_profiles']} actors, {dash['evidence_items']} evidence records.")
    
    # 4. Demo Investigation
    print("\n4. Testing POST /api/investigations/demo...")
    res = client.post("/api/investigations/demo")
    assert res.status_code == 200, f"Demo investigation failed: {res.text}"
    demo_inv = res.json()
    assert demo_inv["id"] == "INV-DEMO-001", f"Unexpected demo ID: {demo_inv.get('id')}"
    print(f"   Demo Investigation loaded OK: {demo_inv['name']}")
    
    # 5. Actors list & Search
    print("\n5. Testing /api/actors & search...")
    res = client.get("/api/actors?page=1&page_size=10")
    assert res.status_code == 200, f"List actors failed: {res.text}"
    actors = res.json()
    assert len(actors["items"]) > 0, "Actors list empty"
    print(f"   Actors list OK: total {actors['total']} actors.")
    
    res = client.get("/api/actors/search?q=shadow")
    assert res.status_code == 200, f"Actor search failed: {res.text}"
    print("   Actor search OK.")
    
    # 6. Actor profile detail
    print("\n6. Testing /api/actors/ACT-001...")
    res = client.get("/api/actors/ACT-001")
    assert res.status_code == 200, f"Actor profile failed: {res.text}"
    profile = res.json()
    assert profile["id"] == "ACT-001", "Profile ID mismatch"
    assert len(profile["aliases"]) > 0, "No aliases for ACT-001"
    assert len(profile["pgp"]) > 0, "No PGP keys for ACT-001"
    print(f"   Actor Profile OK: {profile['display_name']} ({len(profile['aliases'])} aliases, {len(profile['pgp'])} PGP keys).")
    
    # 7. Correlations
    print("\n7. Testing /api/correlations/ACT-001...")
    res = client.get("/api/correlations/ACT-001")
    assert res.status_code == 200, f"Correlations failed: {res.text}"
    corr = res.json()
    assert "candidates" in corr, "No candidates in correlation"
    print(f"   Correlations OK: {len(corr['candidates'])} candidates found.")
    
    # 8. Infrastructure
    print("\n8. Testing /api/infrastructure...")
    res = client.get("/api/infrastructure")
    assert res.status_code == 200, f"Infrastructure failed: {res.text}"
    infra = res.json()
    assert len(infra) > 0, "Infrastructure list empty"
    print(f"   Infrastructure OK: {len(infra)} hidden service indicators.")
    
    # 9. Stylometry
    print("\n9. Testing /api/stylometry/ACT-001...")
    res = client.get("/api/stylometry/ACT-001")
    assert res.status_code == 200, f"Stylometry failed: {res.text}"
    res2 = client.get("/api/stylometry/ACT-001?other=ACT-014")
    assert res2.status_code == 200, f"Stylometry comparison failed: {res2.text}"
    comp = res2.json()
    assert "overall" in comp, "No overall score in stylometry comparison"
    print(f"   Stylometry comparison OK: similarity = {comp['overall']}.")
    
    # 10. Behaviour & Migration
    print("\n10. Testing /api/behaviour & /api/migration...")
    res = client.get("/api/behaviour/ACT-001")
    assert res.status_code == 200, f"Behaviour failed: {res.text}"
    res2 = client.get("/api/migration/ACT-001")
    assert res2.status_code == 200, f"Migration failed: {res2.text}"
    mig = res2.json()
    assert len(mig["candidates"]) > 0, "No migration candidates for ACT-001"
    print(f"   Migration detection OK: {mig['candidates'][0]['old_persona']} -> {mig['candidates'][0]['new_persona']}.")
    
    # 11. Evidence & Timeline
    print("\n11. Testing /api/evidence & /api/timeline...")
    res = client.get("/api/evidence/ACT-001")
    assert res.status_code == 200, f"Evidence failed: {res.text}"
    res2 = client.get("/api/timeline/ACT-001")
    assert res2.status_code == 200, f"Timeline failed: {res2.text}"
    print(f"   Evidence ({len(res.json())} items) & Timeline ({len(res2.json())} items) OK.")
    
    # 12. Relationship Graph
    print("\n12. Testing /api/graph/ACT-001...")
    res = client.get("/api/graph/ACT-001")
    assert res.status_code == 200, f"Graph failed: {res.text}"
    g = res.json()
    assert len(g["nodes"]) > 0, "Graph nodes empty"
    print(f"   Graph projection OK: {len(g['nodes'])} nodes, {len(g['edges'])} edges.")
    
    # 13. Reports generation & export
    print("\n13. Testing /api/reports & exports...")
    res = client.get("/api/reports/INV-DEMO-001")
    assert res.status_code == 200, f"Report failed: {res.text}"
    
    # Test JSON export
    res = client.post("/api/reports/export", json={"investigation_id": "INV-DEMO-001", "format": "json"})
    assert res.status_code == 200, f"JSON export failed: {res.text}"
    
    # Test CSV export
    res = client.post("/api/reports/export", json={"investigation_id": "INV-DEMO-001", "format": "csv"})
    assert res.status_code == 200, f"CSV export failed: {res.text}"
    assert "text/csv" in res.headers["content-type"]
    
    # Test PDF export
    res = client.post("/api/reports/export", json={"investigation_id": "INV-DEMO-001", "format": "pdf"})
    assert res.status_code == 200, f"PDF export failed: {res.text}"
    assert "application/pdf" in res.headers["content-type"]
    assert len(res.content) > 1000, "PDF content too small"
    print(f"   Report Generation & PDF/CSV/JSON export OK (PDF size: {len(res.content)} bytes).")
    
    # 14. Global search & Settings
    print("\n14. Testing /api/search & /api/settings/weights...")
    res = client.get("/api/search?q=shadow_x")
    assert res.status_code == 200, f"Search failed: {res.text}"
    s = res.json()
    assert len(s["identifiers"]["aliases"]) > 0, "Alias not found in search"
    
    res2 = client.get("/api/settings/weights")
    assert res2.status_code == 200, f"Weights failed: {res2.text}"
    print("   Global search & Settings OK.")
    
    print("\n==========================================")
    print("ALL 14 BACKEND & INTEGRATION TESTS PASSED!")
    print("==========================================")

if __name__ == "__main__":
    run_tests()

