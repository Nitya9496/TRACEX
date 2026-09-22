-- Structured store for SIH PS 26151 synthetic threat intelligence.

CREATE TABLE IF NOT EXISTS platforms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    kind TEXT NOT NULL,
    network TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS actors (
    id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    categories TEXT NOT NULL,
    risk_band TEXT NOT NULL,
    first_observed TIMESTAMPTZ NOT NULL,
    last_observed TIMESTAMPTZ NOT NULL,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS aliases (
    id TEXT PRIMARY KEY,
    actor_id TEXT NOT NULL REFERENCES actors(id),
    value TEXT NOT NULL,
    first_seen TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS usernames (
    id TEXT PRIMARY KEY,
    actor_id TEXT NOT NULL REFERENCES actors(id),
    value TEXT NOT NULL,
    platform_id TEXT REFERENCES platforms(id)
);

CREATE TABLE IF NOT EXISTS pgp_identifiers (
    id TEXT PRIMARY KEY,
    actor_id TEXT NOT NULL REFERENCES actors(id),
    fingerprint TEXT NOT NULL,
    key_algo TEXT,
    first_seen TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS wallet_identifiers (
    id TEXT PRIMARY KEY,
    actor_id TEXT NOT NULL REFERENCES actors(id),
    address TEXT NOT NULL,
    asset TEXT,
    first_seen TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS email_identifiers (
    id TEXT PRIMARY KEY,
    actor_id TEXT NOT NULL REFERENCES actors(id),
    value TEXT NOT NULL,
    first_seen TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    actor_id TEXT NOT NULL REFERENCES actors(id),
    platform_id TEXT REFERENCES platforms(id),
    alias TEXT,
    title TEXT,
    body TEXT NOT NULL,
    posted_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS infrastructure (
    id TEXT PRIMARY KEY,
    onion_id TEXT,
    onion_address TEXT,
    clearnet_domain TEXT,
    ssl_cn TEXT,
    ssl_fingerprint TEXT,
    server_banner TEXT,
    misconfig TEXT,
    descriptor_anomaly TEXT,
    actor_id TEXT REFERENCES actors(id),
    first_seen TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS evidence (
    id TEXT PRIMARY KEY,
    evidence_type TEXT NOT NULL,
    source TEXT NOT NULL,
    source_record TEXT,
    timestamp TIMESTAMPTZ NOT NULL,
    actor_id TEXT REFERENCES actors(id),
    related_entities TEXT,
    description TEXT NOT NULL,
    status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS relationships (
    id TEXT PRIMARY KEY,
    source_actor_id TEXT NOT NULL REFERENCES actors(id),
    target_actor_id TEXT NOT NULL REFERENCES actors(id),
    relationship_type TEXT NOT NULL,
    explanation TEXT NOT NULL,
    confidence TEXT NOT NULL,
    evidence_id TEXT REFERENCES evidence(id),
    timestamp TIMESTAMPTZ NOT NULL,
    source TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS timeline_events (
    id TEXT PRIMARY KEY,
    actor_id TEXT REFERENCES actors(id),
    investigation_id TEXT,
    event_type TEXT NOT NULL,
    label TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    related_entity_id TEXT
);

CREATE TABLE IF NOT EXISTS investigations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    search_identifier TEXT,
    identifier_type TEXT,
    category TEXT,
    priority TEXT,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    actor_ids TEXT,
    primary_actor_id TEXT
);

CREATE TABLE IF NOT EXISTS stylometry_results (
    id SERIAL PRIMARY KEY,
    actor_a TEXT NOT NULL,
    actor_b TEXT NOT NULL,
    vocabulary REAL,
    sentence_structure REAL,
    punctuation REAL,
    phrase REAL,
    tfidf REAL,
    overall REAL,
    explanation TEXT
);

CREATE TABLE IF NOT EXISTS behaviour_results (
    id SERIAL PRIMARY KEY,
    actor_id TEXT NOT NULL REFERENCES actors(id),
    posting_frequency REAL,
    peak_hour INTEGER,
    peak_day INTEGER,
    burst_count INTEGER,
    inactivity_days INTEGER,
    summary TEXT
);

CREATE INDEX IF NOT EXISTS idx_aliases_value ON aliases (value);
CREATE INDEX IF NOT EXISTS idx_pgp_fp ON pgp_identifiers (fingerprint);
CREATE INDEX IF NOT EXISTS idx_wallet_addr ON wallet_identifiers (address);
CREATE INDEX IF NOT EXISTS idx_email_val ON email_identifiers (value);
CREATE INDEX IF NOT EXISTS idx_posts_actor ON posts (actor_id);
CREATE INDEX IF NOT EXISTS idx_infra_onion ON infrastructure (onion_address);
CREATE INDEX IF NOT EXISTS idx_evidence_actor ON evidence (actor_id);
CREATE INDEX IF NOT EXISTS idx_timeline_actor ON timeline_events (actor_id);
