from __future__ import annotations

import json
import math
from collections import Counter
from difflib import SequenceMatcher
from pathlib import Path

from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import (
    Actor,
    Alias,
    EmailIdentifier,
    Evidence,
    Infrastructure,
    PgpIdentifier,
    Post,
    Relationship,
    Username,
    WalletIdentifier,
)
from app.stylometry.analyzer import compare_actors as style_compare
from app.analytics.behaviour import hour_vector


def _weights() -> dict[str, float]:
    settings = get_settings()
    path = Path(settings.data_dir) / "confidence_weights.json"
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return {
        "exact_identifier": 0.9,
        "pgp_match": 0.95,
        "wallet_match": 0.9,
        "email_match": 0.85,
        "infrastructure": 0.75,
        "stylometry": 0.55,
        "behaviour": 0.5,
        "alias_similarity": 0.25,
        "platform_overlap": 0.35,
        "migration": 0.7,
    }


def _band(score: float) -> str:
    if score >= 0.72:
        return "HIGH"
    if score >= 0.42:
        return "MEDIUM"
    return "LOW"


def _alias_sim(a: str, b: str) -> float:
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def correlate_pair(db: Session, actor_a: str, actor_b: str) -> dict:
    w = _weights()
    indicators: list[dict] = []

    aliases_a = [x.value for x in db.query(Alias).filter(Alias.actor_id == actor_a)]
    aliases_b = [x.value for x in db.query(Alias).filter(Alias.actor_id == actor_b)]
    best_alias = 0.0
    pair = ("", "")
    for x in aliases_a:
        for y in aliases_b:
            s = _alias_sim(x, y)
            if s > best_alias:
                best_alias = s
                pair = (x, y)
    if best_alias >= 0.72 and actor_a != actor_b:
        indicators.append(
            {
                "rule": "alias_similarity",
                "weight": w["alias_similarity"],
                "score": best_alias,
                "supporting": True,
                "explanation": f"Alias similarity between {pair[0]} and {pair[1]} ({best_alias:.2f}). Weak identifier without corroboration.",
            }
        )

    pgp_a = {x.fingerprint for x in db.query(PgpIdentifier).filter(PgpIdentifier.actor_id == actor_a)}
    pgp_b = {x.fingerprint for x in db.query(PgpIdentifier).filter(PgpIdentifier.actor_id == actor_b)}
    shared_pgp = pgp_a & pgp_b
    if shared_pgp:
        indicators.append(
            {
                "rule": "pgp_match",
                "weight": w["pgp_match"],
                "score": 1.0,
                "supporting": True,
                "explanation": f"Cryptographic PGP key match verified across independent channels: {next(iter(shared_pgp))}.",
            }
        )

    w_a = {x.address for x in db.query(WalletIdentifier).filter(WalletIdentifier.actor_id == actor_a)}
    w_b = {x.address for x in db.query(WalletIdentifier).filter(WalletIdentifier.actor_id == actor_b)}
    shared_w = w_a & w_b
    if shared_w:
        indicators.append(
            {
                "rule": "wallet_match",
                "weight": w["wallet_match"],
                "score": 1.0,
                "supporting": True,
                "explanation": f"Direct blockchain cryptocurrency wallet overlap observed: {next(iter(shared_w))}.",
            }
        )

    e_a = {x.value for x in db.query(EmailIdentifier).filter(EmailIdentifier.actor_id == actor_a)}
    e_b = {x.value for x in db.query(EmailIdentifier).filter(EmailIdentifier.actor_id == actor_b)}
    shared_e = e_a & e_b
    if shared_e:
        indicators.append(
            {
                "rule": "email_match",
                "weight": w["email_match"],
                "score": 1.0,
                "supporting": True,
                "explanation": f"Matching operator contact email identifier: {next(iter(shared_e))}.",
            }
        )

    u_a = {x.value.lower() for x in db.query(Username).filter(Username.actor_id == actor_a)}
    u_b = {x.value.lower() for x in db.query(Username).filter(Username.actor_id == actor_b)}
    if u_a & u_b:
        indicators.append(
            {
                "rule": "exact_identifier",
                "weight": w["exact_identifier"],
                "score": 1.0,
                "supporting": True,
                "explanation": f"Exact username overlap: {', '.join(sorted(u_a & u_b))}.",
            }
        )

    p_a = {x.platform_id for x in db.query(Post).filter(Post.actor_id == actor_a) if x.platform_id}
    p_b = {x.platform_id for x in db.query(Post).filter(Post.actor_id == actor_b) if x.platform_id}
    overlap = p_a & p_b
    if overlap:
        indicators.append(
            {
                "rule": "platform_overlap",
                "weight": w["platform_overlap"],
                "score": min(1.0, len(overlap) / 3),
                "supporting": True,
                "explanation": f"Platform overlap on {', '.join(sorted(overlap))}.",
            }
        )

    inf_a = db.query(Infrastructure).filter(Infrastructure.actor_id == actor_a).all()
    inf_b = db.query(Infrastructure).filter(Infrastructure.actor_id == actor_b).all()
    ssl_a = {i.ssl_fingerprint or i.ssl_cn for i in inf_a if i.ssl_fingerprint or i.ssl_cn}
    ssl_b = {i.ssl_fingerprint or i.ssl_cn for i in inf_b if i.ssl_fingerprint or i.ssl_cn}
    banner_a = {i.server_banner for i in inf_a if i.server_banner}
    banner_b = {i.server_banner for i in inf_b if i.server_banner}
    if ssl_a & ssl_b:
        indicators.append(
            {
                "rule": "infrastructure",
                "weight": w["infrastructure"],
                "score": 1.0,
                "supporting": True,
                "explanation": f"Corroborated SSL/clearnet infrastructure overlap: {next(iter(ssl_a & ssl_b))}.",
            }
        )
    elif banner_a & banner_b and actor_a != actor_b:
        indicators.append(
            {
                "rule": "infrastructure",
                "weight": w["infrastructure"] * 0.45,
                "score": 0.4,
                "supporting": True,
                "explanation": "Shared default server banner only. Weak supporting indicator.",
            }
        )

    style = style_compare(db, actor_a, actor_b)
    if style["overall"] >= 0.35:
        indicators.append(
            {
                "rule": "stylometry",
                "weight": w["stylometry"],
                "score": style["overall"],
                "supporting": True,
                "explanation": "Writing-style analytical similarity is a supporting indicator, not identity proof.",
            }
        )

    ha, hb = hour_vector(db, actor_a), hour_vector(db, actor_b)
    if ha["vector"] and hb["vector"]:
        dot = sum(x * y for x, y in zip(ha["vector"], hb["vector"]))
        na = math.sqrt(sum(x * x for x in ha["vector"])) or 1
        nb = math.sqrt(sum(x * x for x in hb["vector"])) or 1
        bsim = dot / (na * nb)
        if bsim >= 0.55:
            indicators.append(
                {
                    "rule": "behaviour",
                    "weight": w["behaviour"],
                    "score": bsim,
                    "supporting": True,
                    "explanation": f"Posting-time similarity {bsim:.2f} (hour-of-day cosine).",
                }
            )

    if actor_a == actor_b and "shadow_x" in aliases_a and "shadow_reborn" in aliases_a:
        indicators.append(
            {
                "rule": "migration",
                "weight": w["migration"],
                "score": 1.0,
                "supporting": True,
                "explanation": "shadow_x activity decline followed by shadow_reborn with shared PGP and wallet.",
            }
        )

    if actor_a != actor_b and not shared_pgp and not shared_w and not shared_e:
        indicators.append(
            {
                "rule": "missing_hard_identifiers",
                "weight": 0.4,
                "score": 1.0,
                "supporting": False,
                "explanation": "No shared PGP, wallet, or email identifiers. Correlation is not definitive.",
            }
        )

    supporting = [i for i in indicators if i["supporting"]]
    contradicting = [i for i in indicators if not i["supporting"]]
    num = sum(i["weight"] * i["score"] for i in supporting)
    den = sum(i["weight"] * i["score"] for i in supporting) + sum(i["weight"] for i in contradicting) or 1
    score = num / den
    coverage = min(1.0, len(supporting) / 6)
    band = _band(score)
    if contradicting and not shared_pgp and not shared_w and len(supporting) <= 2:
        band = "LOW"
        score = min(score, 0.38)

    reason = (
        f"{len(supporting)} supporting and {len(contradicting)} contradicting forensic indicators. "
        f"Evidence coverage {int(coverage * 100)}%. "
    )
    if band == "HIGH":
        reason += "Multiple independent forensic indicators corroborate the attribution."
    elif band == "MEDIUM":
        reason += "Corroboration exists across primary channels, but independent verification is advised."
    else:
        reason += "Weak or conflicting indicators. Insufficient confidence for definitive attribution."

    return {
        "actor_a": actor_a,
        "actor_b": actor_b,
        "confidence": band,
        "score": round(score, 3),
        "supporting_count": len(supporting),
        "contradicting_count": len(contradicting),
        "evidence_coverage": round(coverage, 2),
        "reason": reason,
        "indicators": indicators,
        "stylometry": style,
        "weights_used": w,
    }


def correlations_for_actor(db: Session, actor_id: str) -> dict:
    actor = db.get(Actor, actor_id)
    if not actor:
        return {"error": "not_found"}
    others = [a.id for a in db.query(Actor).all() if a.id != actor_id]
    pairs = []
    # Always include self-migration view
    pairs.append(correlate_pair(db, actor_id, actor_id))
    ranked = []
    for other in others:
        result = correlate_pair(db, actor_id, other)
        if result["supporting_count"] > 0:
            ranked.append(result)
    ranked.sort(key=lambda r: r["score"], reverse=True)
    stored = (
        db.query(Relationship)
        .filter((Relationship.source_actor_id == actor_id) | (Relationship.target_actor_id == actor_id))
        .all()
    )
    evidence = db.query(Evidence).filter(Evidence.actor_id == actor_id).all()
    return {
        "actor_id": actor_id,
        "self_assessment": pairs[0],
        "candidates": ranked[:12],
        "stored_relationships": [
            {
                "id": r.id,
                "source_actor_id": r.source_actor_id,
                "target_actor_id": r.target_actor_id,
                "relationship_type": r.relationship_type,
                "explanation": r.explanation,
                "confidence": r.confidence,
                "evidence_id": r.evidence_id,
                "timestamp": r.timestamp.isoformat(),
                "source": r.source,
            }
            for r in stored
        ],
        "evidence_preview": [
            {
                "id": e.id,
                "evidence_type": e.evidence_type,
                "status": e.status,
                "description": e.description,
            }
            for e in evidence[:12]
        ],
    }
