from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from datetime import datetime, timezone
import json

from app.analytics.behaviour import profile_actor
from app.analytics.migration import detect_migrations
from app.correlation.engine import correlations_for_actor
from app.database import get_db
from app.models import Actor, Evidence, Infrastructure, Investigation, TimelineEvent
from app.reports.generator import build_report, to_csv, to_pdf
from app.schemas import InvestigationCreate, ReportExportRequest
from app.services.graph_service import actor_graph_from_sql, sync_graph
from app.services.query import actor_payload, dashboard, global_search, resolve_identifier
from app.stylometry.analyzer import actor_profile as style_profile, compare_actors

router = APIRouter()


@router.get("/dashboard")
def get_dashboard(db: Session = Depends(get_db)):
    try:
        return dashboard(db)
    except Exception:
        raise HTTPException(status_code=500, detail="Unable to load dashboard statistics.")


@router.get("/actors")
def list_actors(
    q: str | None = None,
    category: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Actor)
    if q:
        like = f"%{q}%"
        query = query.filter(Actor.id.ilike(like) | Actor.display_name.ilike(like))
    rows = query.order_by(Actor.id).all()
    if category:
        rows = [a for a in rows if category in json.loads(a.categories)]
    total = len(rows)
    start = (page - 1) * page_size
    chunk = rows[start : start + page_size]
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [
            {
                "id": a.id,
                "display_name": a.display_name,
                "categories": json.loads(a.categories),
                "risk_band": a.risk_band,
                "first_observed": a.first_observed.isoformat(),
                "last_observed": a.last_observed.isoformat(),
            }
            for a in chunk
        ],
    }


@router.get("/actors/search")
def search_actors(q: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    return global_search(db, q)


@router.get("/actors/{actor_id}")
def get_actor(actor_id: str, db: Session = Depends(get_db)):
    actor = db.get(Actor, actor_id)
    if not actor:
        raise HTTPException(status_code=404, detail="Actor not found in the synthetic catalogue.")
    payload = actor_payload(db, actor)
    payload["stylometry"] = style_profile(db, actor_id)
    payload["behaviour"] = profile_actor(db, actor_id)
    payload["migration"] = detect_migrations(db, actor_id)
    payload["correlations"] = correlations_for_actor(db, actor_id)
    return payload


@router.get("/investigations")
def list_investigations(db: Session = Depends(get_db)):
    items = db.query(Investigation).order_by(Investigation.created_at.desc()).all()
    return [
        {
            "id": i.id,
            "name": i.name,
            "description": i.description,
            "search_identifier": i.search_identifier,
            "identifier_type": i.identifier_type,
            "category": i.category,
            "priority": i.priority,
            "status": i.status,
            "created_at": i.created_at.isoformat(),
            "actor_ids": json.loads(i.actor_ids or "[]"),
            "primary_actor_id": i.primary_actor_id,
        }
        for i in items
    ]


@router.post("/investigations")
def create_investigation(body: InvestigationCreate, db: Session = Depends(get_db)):
    actor_ids = resolve_identifier(db, body.search_identifier, body.identifier_type)
    inv_id = f"INV-{int(datetime.now(timezone.utc).timestamp())}"
    rec = Investigation(
        id=inv_id,
        name=body.name,
        description=body.description,
        search_identifier=body.search_identifier,
        identifier_type=body.identifier_type,
        category=body.category,
        priority=body.priority,
        status="active",
        created_at=datetime.now(timezone.utc),
        actor_ids=json.dumps(actor_ids),
        primary_actor_id=actor_ids[0] if actor_ids else None,
    )
    db.add(rec)
    db.commit()
    return {"id": inv_id, "actor_ids": actor_ids, "primary_actor_id": rec.primary_actor_id}


@router.post("/investigations/demo")
def demo_investigation(db: Session = Depends(get_db)):
    inv = db.get(Investigation, "INV-DEMO-001")
    if not inv:
        raise HTTPException(status_code=404, detail="Demo investigation is missing from seed data.")
    return _investigation_detail(db, inv)


@router.get("/investigations/{investigation_id}")
def get_investigation(investigation_id: str, db: Session = Depends(get_db)):
    inv = db.get(Investigation, investigation_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found.")
    return _investigation_detail(db, inv)


def _investigation_detail(db: Session, inv: Investigation) -> dict:
    actor_ids = json.loads(inv.actor_ids or "[]")
    primary = inv.primary_actor_id
    actor = db.get(Actor, primary) if primary else None
    return {
        "id": inv.id,
        "name": inv.name,
        "description": inv.description,
        "search_identifier": inv.search_identifier,
        "identifier_type": inv.identifier_type,
        "category": inv.category,
        "priority": inv.priority,
        "status": inv.status,
        "created_at": inv.created_at.isoformat(),
        "actor_ids": actor_ids,
        "primary_actor_id": primary,
        "overview": actor_payload(db, actor) if actor else None,
        "candidates": [
            {"id": a, "display_name": db.get(Actor, a).display_name if db.get(Actor, a) else a}
            for a in actor_ids
        ],
        "correlations": correlations_for_actor(db, primary) if primary else None,
        "infrastructure": [
            {
                "id": i.id,
                "onion_address": i.onion_address,
                "clearnet_domain": i.clearnet_domain,
                "ssl_cn": i.ssl_cn,
                "ssl_fingerprint": i.ssl_fingerprint,
                "server_banner": i.server_banner,
                "misconfig": i.misconfig,
                "descriptor_anomaly": i.descriptor_anomaly,
                "actor_id": i.actor_id,
            }
            for i in db.query(Infrastructure).filter(Infrastructure.actor_id.in_(actor_ids or [primary or "ACT-001"])).all()
        ],
        "stylometry": style_profile(db, primary) if primary else None,
        "behaviour": profile_actor(db, primary) if primary else None,
        "migration": detect_migrations(db, primary) if primary else None,
        "evidence": [
            {
                "id": e.id,
                "evidence_type": e.evidence_type,
                "source": e.source,
                "source_record": e.source_record,
                "timestamp": e.timestamp.isoformat(),
                "related_entities": e.related_entities,
                "description": e.description,
                "status": e.status,
                "actor_id": e.actor_id,
            }
            for e in db.query(Evidence).filter(Evidence.actor_id.in_(actor_ids or [primary or "ACT-001"])).all()
        ],
        "graph": actor_graph_from_sql(db, primary) if primary else {"nodes": [], "edges": []},
        "timeline": [
            {
                "id": t.id,
                "event_type": t.event_type,
                "label": t.label,
                "timestamp": t.timestamp.isoformat(),
                "related_entity_id": t.related_entity_id,
                "actor_id": t.actor_id,
            }
            for t in db.query(TimelineEvent)
            .filter(TimelineEvent.actor_id.in_(actor_ids or [primary or "ACT-001"]))
            .order_by(TimelineEvent.timestamp)
            .all()
        ],
    }


@router.get("/correlations/{actor_id}")
def get_correlations(actor_id: str, db: Session = Depends(get_db)):
    if not db.get(Actor, actor_id):
        raise HTTPException(status_code=404, detail="Actor not found.")
    return correlations_for_actor(db, actor_id)


@router.get("/infrastructure")
def list_infra(db: Session = Depends(get_db)):
    rows = db.query(Infrastructure).all()
    return [
        {
            "id": i.id,
            "onion_id": i.onion_id,
            "onion_address": i.onion_address,
            "clearnet_domain": i.clearnet_domain,
            "ssl_cn": i.ssl_cn,
            "ssl_fingerprint": i.ssl_fingerprint,
            "server_banner": i.server_banner,
            "misconfig": i.misconfig,
            "descriptor_anomaly": i.descriptor_anomaly,
            "actor_id": i.actor_id,
            "first_seen": i.first_seen.isoformat(),
            "evidence": [
                {
                    "id": e.id,
                    "description": e.description,
                    "status": e.status,
                    "source": e.source,
                    "timestamp": e.timestamp.isoformat(),
                }
                for e in db.query(Evidence).filter(Evidence.related_entities.contains(i.id)).limit(6)
            ],
        }
        for i in rows
    ]


@router.get("/stylometry/{actor_id}")
def get_style(actor_id: str, other: str | None = None, db: Session = Depends(get_db)):
    if not db.get(Actor, actor_id):
        raise HTTPException(status_code=404, detail="Actor not found.")
    if other:
        return compare_actors(db, actor_id, other)
    return style_profile(db, actor_id)


@router.get("/behaviour/{actor_id}")
def get_behaviour(actor_id: str, platform: str | None = None, db: Session = Depends(get_db)):
    if not db.get(Actor, actor_id):
        raise HTTPException(status_code=404, detail="Actor not found.")
    return profile_actor(db, actor_id, platform)


@router.get("/migration/{actor_id}")
def get_migration(actor_id: str, db: Session = Depends(get_db)):
    if not db.get(Actor, actor_id):
        raise HTTPException(status_code=404, detail="Actor not found.")
    return detect_migrations(db, actor_id)


@router.get("/evidence/{actor_id}")
def get_evidence(actor_id: str, db: Session = Depends(get_db)):
    rows = db.query(Evidence).filter(Evidence.actor_id == actor_id).order_by(Evidence.timestamp.desc()).all()
    if not rows and not db.get(Actor, actor_id):
        raise HTTPException(status_code=404, detail="Actor not found.")
    return [
        {
            "id": e.id,
            "evidence_type": e.evidence_type,
            "source": e.source,
            "source_record": e.source_record,
            "timestamp": e.timestamp.isoformat(),
            "related_entities": e.related_entities,
            "description": e.description,
            "status": e.status,
            "actor_id": e.actor_id,
        }
        for e in rows
    ]


@router.get("/timeline/{actor_id}")
def get_timeline(actor_id: str, db: Session = Depends(get_db)):
    rows = db.query(TimelineEvent).filter(TimelineEvent.actor_id == actor_id).order_by(TimelineEvent.timestamp).all()
    return [
        {
            "id": t.id,
            "event_type": t.event_type,
            "label": t.label,
            "timestamp": t.timestamp.isoformat(),
            "related_entity_id": t.related_entity_id,
            "actor_id": t.actor_id,
        }
        for t in rows
    ]


@router.get("/graph/{actor_id}")
def get_graph(actor_id: str, db: Session = Depends(get_db)):
    if not db.get(Actor, actor_id):
        raise HTTPException(status_code=404, detail="Actor not found.")
    data = actor_graph_from_sql(db, actor_id)
    if not data["nodes"]:
        raise HTTPException(status_code=500, detail="Graph projection returned no nodes.")
    return data


@router.post("/graph/sync")
def graph_sync(db: Session = Depends(get_db)):
    return sync_graph(db)


@router.get("/reports/{investigation_id}")
def get_report(investigation_id: str, db: Session = Depends(get_db)):
    try:
        return build_report(db, investigation_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Investigation not found.")
    except Exception:
        raise HTTPException(status_code=500, detail="Report generation failed.")


@router.post("/reports/export")
def export_report(body: ReportExportRequest, db: Session = Depends(get_db)):
    try:
        report = build_report(db, body.investigation_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Investigation not found.")
    except Exception:
        raise HTTPException(status_code=500, detail="Report generation failed.")
    if body.format == "json":
        return report
    if body.format == "csv":
        return Response(
            content=to_csv(report),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={body.investigation_id}.csv"},
        )
    return Response(
        content=to_pdf(report),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={body.investigation_id}.pdf"},
    )


@router.get("/search")
def search(q: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    result = global_search(db, q)
    if result.get("error"):
        raise HTTPException(status_code=400, detail=result["message"])
    return result


@router.get("/settings/weights")
def get_weights():
    from pathlib import Path
    from app.config import get_settings

    path = Path(get_settings().data_dir) / "confidence_weights.json"
    return json.loads(path.read_text(encoding="utf-8"))
