from __future__ import annotations

import csv
import io
import json
from datetime import datetime, timezone

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from reportlab.lib import colors
from sqlalchemy.orm import Session

from app.analytics.behaviour import profile_actor
from app.analytics.migration import detect_migrations
from app.correlation.engine import correlations_for_actor
from app.models import Actor, Alias, Evidence, Infrastructure, Investigation, PgpIdentifier, Post, TimelineEvent, WalletIdentifier
from app.stylometry.analyzer import actor_profile as style_profile


DISCLAIMER = (
    "CLASSIFICATION: LAW ENFORCEMENT SENSITIVE // TLP:AMBER — Attribution findings represent multi-factor forensic correlations compiled from cross-platform telemetry."
)


def build_report(db: Session, investigation_id: str) -> dict:
    inv = db.get(Investigation, investigation_id)
    if not inv:
        raise ValueError("Investigation not found")
    actor_id = inv.primary_actor_id or "ACT-001"
    actor = db.get(Actor, actor_id)
    aliases = [a.value for a in db.query(Alias).filter(Alias.actor_id == actor_id)]
    pgp = [p.fingerprint for p in db.query(PgpIdentifier).filter(PgpIdentifier.actor_id == actor_id)]
    wallets = [w.address for w in db.query(WalletIdentifier).filter(WalletIdentifier.actor_id == actor_id)]
    infra = db.query(Infrastructure).filter(Infrastructure.actor_id == actor_id).all()
    corr = correlations_for_actor(db, actor_id)
    style = style_profile(db, actor_id)
    behaviour = profile_actor(db, actor_id)
    migration = detect_migrations(db, actor_id)
    evidence = db.query(Evidence).filter(Evidence.actor_id == actor_id).all()
    timeline = (
        db.query(TimelineEvent)
        .filter(TimelineEvent.actor_id == actor_id)
        .order_by(TimelineEvent.timestamp)
        .all()
    )
    posts = db.query(Post).filter(Post.actor_id == actor_id).all()
    top = corr["candidates"][0] if corr.get("candidates") else None
    return {
        "title": f"Investigation Report — {inv.name}",
        "investigation_id": inv.id,
        "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "executive_summary": (
            f"Investigation {inv.id} examines identifier '{inv.search_identifier}'. "
            f"Primary threat actor {actor_id} ({actor.display_name if actor else 'n/a'}) "
            f"has {len(corr.get('candidates', []))} correlation candidates. "
            + (f"Top candidate {top['actor_b']} at {top['confidence']} confidence. " if top else "")
            + DISCLAIMER
        ),
        "actor_profile": {
            "id": actor_id,
            "display_name": actor.display_name if actor else None,
            "categories": actor.categories if actor else None,
            "first_observed": actor.first_observed.isoformat() if actor else None,
            "last_observed": actor.last_observed.isoformat() if actor else None,
        },
        "identifiers": {"aliases": aliases, "pgp": pgp, "wallets": wallets},
        "associated_platforms": sorted({p.platform_id for p in posts if p.platform_id}),
        "infrastructure_indicators": [
            {
                "id": i.id,
                "onion": i.onion_address,
                "clearnet": i.clearnet_domain,
                "ssl_cn": i.ssl_cn,
                "banner": i.server_banner,
                "misconfig": i.misconfig,
                "descriptor": i.descriptor_anomaly,
            }
            for i in infra
        ],
        "relationship_graph_summary": {
            "stored_relationships": len(corr.get("stored_relationships", [])),
            "candidates": [
                {"actor": c["actor_b"], "confidence": c["confidence"], "score": c["score"]}
                for c in corr.get("candidates", [])[:8]
            ],
        },
        "stylometric_analysis": {
            "top_comparisons": style.get("top_comparisons", [])[:5],
            "disclaimer": style.get("disclaimer"),
        },
        "behavioural_analysis": behaviour,
        "persona_migration": migration,
        "evidence_table": [
            {
                "id": e.id,
                "type": e.evidence_type,
                "source": e.source,
                "status": e.status,
                "timestamp": e.timestamp.isoformat(),
                "description": e.description,
            }
            for e in evidence
        ],
        "confidence_explanation": corr.get("self_assessment"),
        "timeline": [
            {"id": t.id, "type": t.event_type, "label": t.label, "timestamp": t.timestamp.isoformat()}
            for t in timeline
        ],
        "source_records": [{"id": p.id, "body": p.body, "posted_at": p.posted_at.isoformat()} for p in posts[:20]],
        "disclaimer": DISCLAIMER,
    }


def to_pdf(report: dict) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, title=report["title"])
    styles = getSampleStyleSheet()
    story = [
        Paragraph(report["title"], styles["Title"]),
        Paragraph(f"Investigation ID: {report['investigation_id']} | Date: {report['date']}", styles["Normal"]),
        Spacer(1, 12),
        Paragraph("Executive summary", styles["Heading2"]),
        Paragraph(report["executive_summary"], styles["BodyText"]),
        Spacer(1, 8),
        Paragraph("Actor profile", styles["Heading2"]),
        Paragraph(json.dumps(report["actor_profile"]), styles["Code"]),
        Paragraph("Identifiers", styles["Heading2"]),
        Paragraph(json.dumps(report["identifiers"]), styles["Code"]),
        Paragraph("Infrastructure", styles["Heading2"]),
        Paragraph(json.dumps(report["infrastructure_indicators"]), styles["Code"]),
        Paragraph("Disclaimer", styles["Heading2"]),
        Paragraph(report["disclaimer"], styles["BodyText"]),
    ]
    ev_rows = [["ID", "Type", "Status"]] + [[e["id"], e["type"], e["status"]] for e in report["evidence_table"][:25]]
    table = Table(ev_rows, colWidths=[80, 220, 80])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1b2430")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("GRID", (0, 0), (-1, -1), 0.25, colors.grey),
            ]
        )
    )
    story.append(Paragraph("Evidence", styles["Heading2"]))
    story.append(table)
    doc.build(story)
    return buf.getvalue()


def to_csv(report: dict) -> bytes:
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["section", "key", "value"])
    writer.writerow(["meta", "investigation_id", report["investigation_id"]])
    writer.writerow(["meta", "title", report["title"]])
    writer.writerow(["meta", "disclaimer", report["disclaimer"]])
    for e in report["evidence_table"]:
        writer.writerow(["evidence", e["id"], e["description"]])
    for t in report["timeline"]:
        writer.writerow(["timeline", t["id"], t["label"]])
    return buf.getvalue().encode("utf-8")
