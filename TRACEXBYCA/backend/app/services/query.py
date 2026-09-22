from __future__ import annotations

import json
from datetime import datetime, timezone

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.models import (
    Actor,
    Alias,
    EmailIdentifier,
    Evidence,
    Infrastructure,
    Investigation,
    PgpIdentifier,
    Post,
    Relationship,
    TimelineEvent,
    Username,
    WalletIdentifier,
)


def dashboard(db: Session) -> dict:
    actors = db.query(Actor).count()
    investigations = db.query(Investigation).filter(Investigation.status == "active").count()
    evidence = db.query(Evidence).count()
    infra = db.query(Infrastructure).count()
    rels = db.query(Relationship).count()
    high = db.query(Relationship).filter(Relationship.confidence == "HIGH").count()
    migrations = db.query(Relationship).filter(Relationship.relationship_type == "MIGRATED_TO").count()
    recent = (
        db.query(TimelineEvent).order_by(TimelineEvent.timestamp.desc()).limit(12).all()
    )
    return {
        "active_investigations": investigations,
        "threat_actor_profiles": actors,
        "correlated_identities": high,
        "infrastructure_indicators": infra,
        "potential_persona_linkages": migrations,
        "evidence_items": evidence,
        "correlation_statistics": {
            "relationships": rels,
            "high_confidence": high,
            "posts": db.query(Post).count(),
            "pgp": db.query(PgpIdentifier).count(),
            "wallets": db.query(WalletIdentifier).count(),
        },
        "recent_activity": [
            {
                "id": e.id,
                "label": e.label,
                "type": e.event_type,
                "timestamp": e.timestamp.isoformat(),
                "actor_id": e.actor_id,
            }
            for e in recent
        ],
        "investigations": [
            {
                "id": i.id,
                "name": i.name,
                "priority": i.priority,
                "status": i.status,
                "created_at": i.created_at.isoformat(),
            }
            for i in db.query(Investigation).order_by(Investigation.created_at.desc()).all()
        ],
    }


def actor_payload(db: Session, actor: Actor) -> dict:
    aliases = db.query(Alias).filter(Alias.actor_id == actor.id).all()
    users = db.query(Username).filter(Username.actor_id == actor.id).all()
    pgp = db.query(PgpIdentifier).filter(PgpIdentifier.actor_id == actor.id).all()
    wallets = db.query(WalletIdentifier).filter(WalletIdentifier.actor_id == actor.id).all()
    emails = db.query(EmailIdentifier).filter(EmailIdentifier.actor_id == actor.id).all()
    posts = db.query(Post).filter(Post.actor_id == actor.id).all()
    infra = db.query(Infrastructure).filter(Infrastructure.actor_id == actor.id).all()
    ev = db.query(Evidence).filter(Evidence.actor_id == actor.id).all()
    platforms = sorted({p.platform_id for p in posts if p.platform_id})
    span = max(1, (actor.last_observed - actor.first_observed).days)
    return {
        "id": actor.id,
        "display_name": actor.display_name,
        "categories": json.loads(actor.categories),
        "risk_band": actor.risk_band,
        "first_observed": actor.first_observed.isoformat(),
        "last_observed": actor.last_observed.isoformat(),
        "notes": actor.notes,
        "aliases": [{"id": a.id, "value": a.value, "status": a.status, "first_seen": a.first_seen.isoformat()} for a in aliases],
        "usernames": [{"id": u.id, "value": u.value, "platform_id": u.platform_id} for u in users],
        "pgp": [{"id": p.id, "fingerprint": p.fingerprint, "algo": p.key_algo} for p in pgp],
        "wallets": [{"id": w.id, "address": w.address, "asset": w.asset} for w in wallets],
        "emails": [{"id": e.id, "value": e.value} for e in emails],
        "platforms": platforms,
        "activity_frequency": round(len(posts) / span, 3),
        "post_count": len(posts),
        "infrastructure": [
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
            }
            for i in infra
        ],
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
            }
            for e in ev
        ],
    }


def global_search(db: Session, q: str) -> dict:
    qn = q.strip()
    if not qn:
        return {"error": "invalid_search", "message": "Enter an identifier, actor ID, or infrastructure value."}
    like = f"%{qn}%"
    actors = db.query(Actor).filter(or_(Actor.id.ilike(like), Actor.display_name.ilike(like))).all()
    aliases = db.query(Alias).filter(Alias.value.ilike(like)).all()
    pgp = db.query(PgpIdentifier).filter(or_(PgpIdentifier.fingerprint.ilike(like), PgpIdentifier.id.ilike(like))).all()
    wallets = db.query(WalletIdentifier).filter(or_(WalletIdentifier.address.ilike(like), WalletIdentifier.id.ilike(like))).all()
    emails = db.query(EmailIdentifier).filter(EmailIdentifier.value.ilike(like)).all()
    infra = db.query(Infrastructure).filter(
        or_(
            Infrastructure.onion_address.ilike(like),
            Infrastructure.clearnet_domain.ilike(like),
            Infrastructure.id.ilike(like),
        )
    ).all()
    evidence = db.query(Evidence).filter(or_(Evidence.id.ilike(like), Evidence.description.ilike(like))).limit(20).all()
    posts = db.query(Post).filter(or_(Post.id.ilike(like), Post.body.ilike(like), Post.alias.ilike(like))).limit(20).all()
    return {
        "query": qn,
        "actors": [{"id": a.id, "display_name": a.display_name} for a in actors],
        "identifiers": {
            "aliases": [{"id": a.id, "value": a.value, "actor_id": a.actor_id} for a in aliases],
            "pgp": [{"id": p.id, "fingerprint": p.fingerprint, "actor_id": p.actor_id} for p in pgp],
            "wallets": [{"id": w.id, "address": w.address, "actor_id": w.actor_id} for w in wallets],
            "emails": [{"id": e.id, "value": e.value, "actor_id": e.actor_id} for e in emails],
        },
        "infrastructure": [{"id": i.id, "onion": i.onion_address, "clearnet": i.clearnet_domain, "actor_id": i.actor_id} for i in infra],
        "evidence": [{"id": e.id, "type": e.evidence_type, "description": e.description} for e in evidence],
        "posts": [{"id": p.id, "alias": p.alias, "actor_id": p.actor_id} for p in posts],
    }


def resolve_identifier(db: Session, value: str, identifier_type: str) -> list[str]:
    like = f"%{value}%"
    ids: set[str] = set()
    if identifier_type in ("alias", "username"):
        for row in db.query(Alias).filter(Alias.value.ilike(like)):
            ids.add(row.actor_id)
        for row in db.query(Username).filter(Username.value.ilike(like)):
            ids.add(row.actor_id)
    elif identifier_type == "pgp":
        for row in db.query(PgpIdentifier).filter(or_(PgpIdentifier.fingerprint.ilike(like), PgpIdentifier.id.ilike(like))):
            ids.add(row.actor_id)
    elif identifier_type == "wallet":
        for row in db.query(WalletIdentifier).filter(or_(WalletIdentifier.address.ilike(like), WalletIdentifier.id.ilike(like))):
            ids.add(row.actor_id)
    elif identifier_type == "email":
        for row in db.query(EmailIdentifier).filter(EmailIdentifier.value.ilike(like)):
            ids.add(row.actor_id)
    elif identifier_type == "platform":
        for row in db.query(Post).filter(Post.platform_id.ilike(like)):
            ids.add(row.actor_id)
    elif identifier_type == "onion":
        for row in db.query(Infrastructure).filter(
            or_(Infrastructure.onion_address.ilike(like), Infrastructure.onion_id.ilike(like))
        ):
            if row.actor_id:
                ids.add(row.actor_id)
    actor = db.get(Actor, value.upper())
    if actor:
        ids.add(actor.id)
    return sorted(ids)
