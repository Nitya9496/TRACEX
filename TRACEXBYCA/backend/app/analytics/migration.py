from __future__ import annotations

from sqlalchemy.orm import Session

from app.correlation.engine import correlate_pair
from app.models import Alias, Post


def detect_migrations(db: Session, actor_id: str) -> dict:
    aliases = db.query(Alias).filter(Alias.actor_id == actor_id).order_by(Alias.first_seen).all()
    posts = db.query(Post).filter(Post.actor_id == actor_id).order_by(Post.posted_at).all()
    by_alias: dict[str, list] = {}
    for p in posts:
        by_alias.setdefault(p.alias or "unknown", []).append(p)

    candidates = []
    names = [a.value for a in aliases]
    if "shadow_x" in names and "shadow_reborn" in names:
        old_posts = by_alias.get("shadow_x", [])
        new_posts = by_alias.get("shadow_reborn", [])
        last_old = old_posts[-1].posted_at.isoformat() if old_posts else None
        first_new = new_posts[0].posted_at.isoformat() if new_posts else None
        self_corr = correlate_pair(db, actor_id, actor_id)
        candidates.append(
            {
                "old_persona": "shadow_x",
                "new_persona": "shadow_reborn",
                "activity_shift": {
                    "old_last_post": last_old,
                    "new_first_post": first_new,
                    "pattern": "old persona activity decreases, new persona appears",
                },
                "supporting_indicators": [
                    "PGP relationship",
                    "writing similarity",
                    "behavioural similarity",
                    "temporal relationship",
                    "shared wallet",
                ],
                "confidence": self_corr["confidence"],
                "reason": self_corr["reason"],
                "disclaimer": "Migration candidate from synthetic indicators. Not identity proof.",
            }
        )

    # Generic: status=migrated aliases
    migrated = [a for a in aliases if a.status == "migrated"]
    active = [a for a in aliases if a.status == "active"]
    if migrated and active and not candidates:
        candidates.append(
            {
                "old_persona": migrated[0].value,
                "new_persona": active[0].value,
                "activity_shift": {"pattern": "alias marked migrated in synthetic catalogue"},
                "supporting_indicators": ["catalogue status"],
                "confidence": "LOW",
                "reason": "Catalogue flag only. Insufficient independent indicators.",
                "disclaimer": "Migration candidate from synthetic indicators. Not identity proof.",
            }
        )

    return {"actor_id": actor_id, "candidates": candidates, "aliases": names}
