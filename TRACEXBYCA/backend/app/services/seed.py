from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import Base, engine
from app.models import (
    Actor,
    Alias,
    EmailIdentifier,
    Evidence,
    Infrastructure,
    Investigation,
    PgpIdentifier,
    Platform,
    Post,
    Relationship,
    TimelineEvent,
    Username,
    WalletIdentifier,
)


def _parse(ts: str) -> datetime:
    return datetime.fromisoformat(ts.replace("Z", "+00:00"))


def _load(name: str) -> list | dict:
    path = Path(get_settings().data_dir) / name
    return json.loads(path.read_text(encoding="utf-8"))


def seed_if_empty(db: Session) -> None:
    Base.metadata.create_all(bind=engine)
    if db.query(Actor).count() > 0:
        return
    seed_all(db)


def seed_all(db: Session) -> None:
    Base.metadata.create_all(bind=engine)
    for row in _load("platforms.json"):
        db.merge(Platform(**row))
    for row in _load("actors.json"):
        payload = dict(row)
        payload["categories"] = json.dumps(payload["categories"])
        payload["first_observed"] = _parse(row["first_observed"])
        payload["last_observed"] = _parse(row["last_observed"])
        db.merge(Actor(**payload))
    for row in _load("aliases.json"):
        payload = dict(row)
        payload["first_seen"] = _parse(row["first_seen"])
        db.merge(Alias(**payload))
    for row in _load("usernames.json"):
        db.merge(Username(**row))
    for row in _load("pgp.json"):
        payload = dict(row)
        payload["first_seen"] = _parse(row["first_seen"])
        db.merge(PgpIdentifier(**payload))
    for row in _load("wallets.json"):
        payload = dict(row)
        payload["first_seen"] = _parse(row["first_seen"])
        db.merge(WalletIdentifier(**payload))
    for row in _load("emails.json"):
        payload = dict(row)
        payload["first_seen"] = _parse(row["first_seen"])
        db.merge(EmailIdentifier(**payload))
    for row in _load("posts.json"):
        payload = dict(row)
        payload["posted_at"] = _parse(row["posted_at"])
        db.merge(Post(**payload))
    for row in _load("infrastructure.json"):
        payload = dict(row)
        payload["first_seen"] = _parse(row["first_seen"])
        db.merge(Infrastructure(**payload))
    for row in _load("evidence.json"):
        payload = dict(row)
        payload["timestamp"] = _parse(row["timestamp"])
        db.merge(Evidence(**payload))
    for row in _load("relationships.json"):
        payload = dict(row)
        payload["timestamp"] = _parse(row["timestamp"])
        db.merge(Relationship(**payload))
    for row in _load("timeline.json"):
        payload = dict(row)
        payload["timestamp"] = _parse(row["timestamp"])
        db.merge(TimelineEvent(**payload))
    for row in _load("investigations.json"):
        payload = dict(row)
        payload["created_at"] = _parse(row["created_at"])
        payload["actor_ids"] = json.dumps(payload["actor_ids"])
        db.merge(Investigation(**payload))
    db.commit()
