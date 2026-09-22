from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text, Float
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Actor(Base):
    __tablename__ = "actors"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    display_name: Mapped[str] = mapped_column(String)
    categories: Mapped[str] = mapped_column(Text)
    risk_band: Mapped[str] = mapped_column(String)
    first_observed: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    last_observed: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class Platform(Base):
    __tablename__ = "platforms"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String)
    kind: Mapped[str] = mapped_column(String)
    network: Mapped[str] = mapped_column(String)


class Alias(Base):
    __tablename__ = "aliases"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    actor_id: Mapped[str] = mapped_column(String)
    value: Mapped[str] = mapped_column(String)
    first_seen: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(String)


class Username(Base):
    __tablename__ = "usernames"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    actor_id: Mapped[str] = mapped_column(String)
    value: Mapped[str] = mapped_column(String)
    platform_id: Mapped[str | None] = mapped_column(String, nullable=True)


class PgpIdentifier(Base):
    __tablename__ = "pgp_identifiers"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    actor_id: Mapped[str] = mapped_column(String)
    fingerprint: Mapped[str] = mapped_column(String)
    key_algo: Mapped[str | None] = mapped_column(String, nullable=True)
    first_seen: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class WalletIdentifier(Base):
    __tablename__ = "wallet_identifiers"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    actor_id: Mapped[str] = mapped_column(String)
    address: Mapped[str] = mapped_column(String)
    asset: Mapped[str | None] = mapped_column(String, nullable=True)
    first_seen: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class EmailIdentifier(Base):
    __tablename__ = "email_identifiers"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    actor_id: Mapped[str] = mapped_column(String)
    value: Mapped[str] = mapped_column(String)
    first_seen: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Post(Base):
    __tablename__ = "posts"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    actor_id: Mapped[str] = mapped_column(String)
    platform_id: Mapped[str | None] = mapped_column(String, nullable=True)
    alias: Mapped[str | None] = mapped_column(String, nullable=True)
    title: Mapped[str | None] = mapped_column(String, nullable=True)
    body: Mapped[str] = mapped_column(Text)
    posted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Infrastructure(Base):
    __tablename__ = "infrastructure"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    onion_id: Mapped[str | None] = mapped_column(String, nullable=True)
    onion_address: Mapped[str | None] = mapped_column(String, nullable=True)
    clearnet_domain: Mapped[str | None] = mapped_column(String, nullable=True)
    ssl_cn: Mapped[str | None] = mapped_column(String, nullable=True)
    ssl_fingerprint: Mapped[str | None] = mapped_column(String, nullable=True)
    server_banner: Mapped[str | None] = mapped_column(String, nullable=True)
    misconfig: Mapped[str | None] = mapped_column(String, nullable=True)
    descriptor_anomaly: Mapped[str | None] = mapped_column(String, nullable=True)
    actor_id: Mapped[str | None] = mapped_column(String, nullable=True)
    first_seen: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Evidence(Base):
    __tablename__ = "evidence"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    evidence_type: Mapped[str] = mapped_column(String)
    source: Mapped[str] = mapped_column(String)
    source_record: Mapped[str | None] = mapped_column(Text, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    actor_id: Mapped[str | None] = mapped_column(String, nullable=True)
    related_entities: Mapped[str | None] = mapped_column(Text, nullable=True)
    description: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String)


class Relationship(Base):
    __tablename__ = "relationships"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    source_actor_id: Mapped[str] = mapped_column(String)
    target_actor_id: Mapped[str] = mapped_column(String)
    relationship_type: Mapped[str] = mapped_column(String)
    explanation: Mapped[str] = mapped_column(Text)
    confidence: Mapped[str] = mapped_column(String)
    evidence_id: Mapped[str | None] = mapped_column(String, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    source: Mapped[str] = mapped_column(String)


class TimelineEvent(Base):
    __tablename__ = "timeline_events"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    actor_id: Mapped[str | None] = mapped_column(String, nullable=True)
    investigation_id: Mapped[str | None] = mapped_column(String, nullable=True)
    event_type: Mapped[str] = mapped_column(String)
    label: Mapped[str] = mapped_column(String)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    related_entity_id: Mapped[str | None] = mapped_column(String, nullable=True)


class Investigation(Base):
    __tablename__ = "investigations"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    search_identifier: Mapped[str | None] = mapped_column(String, nullable=True)
    identifier_type: Mapped[str | None] = mapped_column(String, nullable=True)
    category: Mapped[str | None] = mapped_column(String, nullable=True)
    priority: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    actor_ids: Mapped[str | None] = mapped_column(Text, nullable=True)
    primary_actor_id: Mapped[str | None] = mapped_column(String, nullable=True)


class StylometryResult(Base):
    __tablename__ = "stylometry_results"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    actor_a: Mapped[str] = mapped_column(String)
    actor_b: Mapped[str] = mapped_column(String)
    vocabulary: Mapped[float] = mapped_column(Float)
    sentence_structure: Mapped[float] = mapped_column(Float)
    punctuation: Mapped[float] = mapped_column(Float)
    phrase: Mapped[float] = mapped_column(Float)
    tfidf: Mapped[float] = mapped_column(Float)
    overall: Mapped[float] = mapped_column(Float)
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)


class BehaviourResult(Base):
    __tablename__ = "behaviour_results"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    actor_id: Mapped[str] = mapped_column(String)
    posting_frequency: Mapped[float] = mapped_column(Float)
    peak_hour: Mapped[int] = mapped_column(Integer)
    peak_day: Mapped[int] = mapped_column(Integer)
    burst_count: Mapped[int] = mapped_column(Integer)
    inactivity_days: Mapped[int] = mapped_column(Integer)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
