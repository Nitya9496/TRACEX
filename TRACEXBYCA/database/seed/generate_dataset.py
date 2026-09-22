"""Deterministic synthetic dataset for SIH PS 26151.

All records are fictional. No live collection. No real identifiers.
"""
from __future__ import annotations

import json
import random
from datetime import datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"
RNG = random.Random(26151)

PLATFORMS = [
    {"id": "PLT-001", "name": "Forum-A", "kind": "forum", "network": "hidden_service"},
    {"id": "PLT-002", "name": "Marketplace-B", "kind": "marketplace", "network": "hidden_service"},
    {"id": "PLT-003", "name": "RelayBoard", "kind": "forum", "network": "hidden_service"},
    {"id": "PLT-004", "name": "VaultExchange", "kind": "marketplace", "network": "hidden_service"},
    {"id": "PLT-005", "name": "CipherChat", "kind": "messaging", "network": "hidden_service"},
    {"id": "PLT-006", "name": "GreyIndex", "kind": "directory", "network": "mixed"},
    {"id": "PLT-007", "name": "NorthLedger", "kind": "marketplace", "network": "hidden_service"},
    {"id": "PLT-008", "name": "EchoPaste", "kind": "paste", "network": "clearnet_mirror"},
    {"id": "PLT-009", "name": "SilentDrop", "kind": "forum", "network": "hidden_service"},
    {"id": "PLT-010", "name": "AmberWire", "kind": "messaging", "network": "hidden_service"},
]

CATEGORIES = [
    "stolen_data",
    "access_broker",
    "fraud",
    "malware_affiliate",
    "financial_crime",
    "unknown",
]

PHRASES_A = [
    "escrow first, always",
    "refund only after confirmation",
    "batch drops every third cycle",
    "use the same signing key",
]
PHRASES_B = [
    "fast shipping no questions",
    "new shop open now",
    "cheap bulk lots",
]
PHRASES_C = [
    "operational security is non-negotiable",
    "rotate dead drops weekly",
]


def iso(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def fingerprint(n: int) -> str:
    hex_chars = "0123456789ABCDEF"
    body = "".join(RNG.choice(hex_chars) for _ in range(40))
    return f"SYNTH-{n:03d}-{body}"


def wallet_id(n: int) -> str:
    alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
    return f"syn1{''.join(RNG.choice(alphabet) for _ in range(28))}-{n:03d}"


def build() -> dict:
    start = datetime(2025, 1, 8, 12, 0, 0)
    actors = []
    aliases = []
    usernames = []
    pgp = []
    wallets = []
    emails = []
    posts = []
    infra = []
    relationships = []
    evidence = []
    timeline = []

    names = [
        ("ACT-001", "Nexus Cluster", ["stolen_data", "access_broker"], "high"),
        ("ACT-002", "Isolated Vendor", ["fraud"], "low"),
        ("ACT-003", "Clockwork Poster", ["malware_affiliate"], "medium"),
        ("ACT-004", "Amber Reseller", ["financial_crime"], "medium"),
        ("ACT-005", "Cipher Cartel Node", ["stolen_data"], "high"),
        ("ACT-006", "Quiet Drop Operator", ["unknown"], "low"),
        ("ACT-007", "North Ledger Clerk", ["financial_crime"], "medium"),
        ("ACT-008", "Shift Twin Candidate", ["malware_affiliate"], "medium"),
        ("ACT-009", "Grey Index Scout", ["access_broker"], "low"),
        ("ACT-010", "Vault Stall", ["fraud"], "low"),
        ("ACT-011", "Echo Paste Author", ["stolen_data"], "medium"),
        ("ACT-012", "Silent Board Mod", ["unknown"], "low"),
        ("ACT-013", "Wire Runner", ["financial_crime"], "medium"),
        ("ACT-014", "Batch Key Holder", ["access_broker"], "high"),
        ("ACT-015", "Shared-Wallet Alpha", ["stolen_data"], "high"),
        ("ACT-016", "Shared-Wallet Beta", ["stolen_data"], "high"),
        ("ACT-017", "Banner Leak Shop", ["fraud"], "medium"),
        ("ACT-018", "Descriptor Anomaly", ["unknown"], "medium"),
        ("ACT-019", "Forum-A Regular", ["malware_affiliate"], "low"),
        ("ACT-020", "Marketplace-B Ghost", ["fraud"], "low"),
        ("ACT-021", "RelayBoard Lurker", ["unknown"], "low"),
        ("ACT-022", "AmberWire Courier", ["financial_crime"], "low"),
    ]

    alias_pairs = {
        "ACT-001": ["shadow_x", "shadow_reborn", "nx_drop"],
        "ACT-002": ["frost_vendor"],
        "ACT-003": ["clockwork_77"],
        "ACT-004": ["amber_rs"],
        "ACT-005": ["cipher_cartel", "cc_ops"],
        "ACT-006": ["quiet_drop"],
        "ACT-007": ["nl_clerk"],
        "ACT-008": ["shift_twin"],
        "ACT-009": ["grey_scout"],
        "ACT-010": ["vault_stall"],
        "ACT-011": ["echo_author", "paste_echo"],
        "ACT-012": ["silent_mod"],
        "ACT-013": ["wire_runner"],
        "ACT-014": ["batch_key"],
        "ACT-015": ["alpha_lot"],
        "ACT-016": ["beta_lot"],
        "ACT-017": ["banner_shop"],
        "ACT-018": ["desc_mismatch"],
        "ACT-019": ["fa_regular"],
        "ACT-020": ["mb_ghost"],
        "ACT-021": ["rb_lurk"],
        "ACT-022": ["aw_courier", "courier_aw"],
    }

    # extra aliases to reach 40+
    extras = [
        ("ACT-004", "amber_v2"),
        ("ACT-005", "cartel_mirror"),
        ("ACT-007", "ledger_ops"),
        ("ACT-009", "index_walker"),
        ("ACT-010", "stall_relist"),
        ("ACT-012", "board_keeper"),
        ("ACT-013", "runner_west"),
        ("ACT-014", "keyholder"),
        ("ACT-017", "shop_rebrand"),
        ("ACT-019", "regular_alt"),
        ("ACT-020", "ghost_alt"),
        ("ACT-003", "cw_night"),
        ("ACT-008", "st_night"),
        ("ACT-006", "qd_alt"),
        ("ACT-021", "lurk_two"),
        ("ACT-002", "frost_closed"),
        ("ACT-018", "hs_desc"),
        ("ACT-022", "wire_aw"),
    ]

    alias_id = 1
    username_id = 1
    actor_alias_map: dict[str, list[str]] = {}
    actor_user_map: dict[str, list[str]] = {}

    for aid, extra in extras:
        alias_pairs.setdefault(aid, []).append(extra)

    for aid, display, cats, risk in names:
        first = start + timedelta(days=RNG.randint(0, 40))
        last = datetime(2026, 8, 20) if aid != "ACT-001" else datetime(2026, 9, 12)
        if aid == "ACT-001":
            first = datetime(2025, 2, 2, 18, 11)
        actors.append(
            {
                "id": aid,
                "display_name": display,
                "categories": cats,
                "risk_band": risk,
                "first_observed": iso(first),
                "last_observed": iso(last),
                "notes": "Synthetic actor record for investigation rehearsal.",
            }
        )
        actor_alias_map[aid] = []
        actor_user_map[aid] = []
        for alias in alias_pairs[aid]:
            alid = f"ALS-{alias_id:03d}"
            uid = f"USR-{username_id:03d}"
            aliases.append(
                {
                    "id": alid,
                    "actor_id": aid,
                    "value": alias,
                    "first_seen": iso(first + timedelta(days=alias_id % 12)),
                    "status": "migrated" if alias == "shadow_x" else "active",
                }
            )
            usernames.append({"id": uid, "actor_id": aid, "value": alias, "platform_id": "PLT-001"})
            actor_alias_map[aid].append(alid)
            actor_user_map[aid].append(uid)
            timeline.append(
                {
                    "id": f"TL-{len(timeline)+1:04d}",
                    "actor_id": aid,
                    "event_type": "alias_created",
                    "label": f"Alias {alias} first observed",
                    "timestamp": iso(first + timedelta(days=alias_id % 12)),
                    "related_entity_id": alid,
                }
            )
            alias_id += 1
            username_id += 1

    # PGP / wallets / emails: 20 each
    pgp_by_actor: dict[str, str] = {}
    wallet_by_actor: dict[str, str] = {}
    for i, (aid, *_rest) in enumerate(names[:20], start=1):
        pid = f"PGP-{i:03d}"
        wid = f"WLT-{i:03d}"
        eid = f"EML-{i:03d}"
        fp = fingerprint(i)
        wval = wallet_id(i)
        # Shared identifiers for correlated clusters
        if aid == "ACT-001":
            fp = "SYNTH-001-A1B2C3D4E5F60718293A4B5C6D7E8F901234ABCD"
            wval = "syn1NexusClusterWallet001AAAAAA-001"
        if aid in ("ACT-015", "ACT-016"):
            wval = "syn1SharedLotWallet000000000015"
            if aid == "ACT-016":
                wid = "WLT-016"
        if aid == "ACT-014":
            fp = "SYNTH-001-A1B2C3D4E5F60718293A4B5C6D7E8F901234ABCD"  # shared with ACT-001
        pgp.append(
            {
                "id": pid,
                "actor_id": aid,
                "fingerprint": fp,
                "key_algo": "RSA-4096-SYNTH",
                "first_seen": actors[i - 1]["first_observed"],
            }
        )
        wallets.append(
            {
                "id": wid,
                "actor_id": aid,
                "address": wval,
                "asset": "SYNTH-COIN",
                "first_seen": actors[i - 1]["first_observed"],
            }
        )
        emails.append(
            {
                "id": eid,
                "actor_id": aid,
                "value": f"{aid.lower().replace('-', '.')}@synthetic.invalid",
                "first_seen": actors[i - 1]["first_observed"],
            }
        )
        pgp_by_actor[aid] = pid
        wallet_by_actor[aid] = wid
        timeline.append(
            {
                "id": f"TL-{len(timeline)+1:04d}",
                "actor_id": aid,
                "event_type": "pgp_observed",
                "label": f"PGP {pid} observed",
                "timestamp": actors[i - 1]["first_observed"],
                "related_entity_id": pid,
            }
        )
        timeline.append(
            {
                "id": f"TL-{len(timeline)+1:04d}",
                "actor_id": aid,
                "event_type": "wallet_observed",
                "label": f"Wallet {wid} observed",
                "timestamp": actors[i - 1]["first_observed"],
                "related_entity_id": wid,
            }
        )

    # ACT-001 also uses PGP-001 and WLT-001 already; ACT-014 shares PGP fingerprint value.

    infra = [
        {
            "id": "INF-001",
            "onion_id": "ONION-001",
            "onion_address": "demo123.onion",
            "clearnet_domain": "demo.example.test",
            "ssl_cn": "demo.example.test",
            "ssl_fingerprint": "SYNTH-CERT-AA11BB22",
            "server_banner": "Apache/2.4.x",
            "misconfig": "server-status exposed",
            "descriptor_anomaly": "synthetic descriptor mismatch",
            "actor_id": "ACT-001",
            "first_seen": "2025-04-11T09:00:00Z",
        },
        {
            "id": "INF-002",
            "onion_id": "ONION-002",
            "onion_address": "frostshop.onion",
            "clearnet_domain": None,
            "ssl_cn": None,
            "ssl_fingerprint": None,
            "server_banner": "nginx/1.18.x",
            "misconfig": None,
            "descriptor_anomaly": None,
            "actor_id": "ACT-002",
            "first_seen": "2025-05-02T11:20:00Z",
        },
        {
            "id": "INF-003",
            "onion_id": "ONION-003",
            "onion_address": "cartelhub.onion",
            "clearnet_domain": "cartel-status.example.test",
            "ssl_cn": "cartel-status.example.test",
            "ssl_fingerprint": "SYNTH-CERT-CC33DD44",
            "server_banner": "Apache/2.4.x",
            "misconfig": "server-status exposed",
            "descriptor_anomaly": "published descriptor clock skew",
            "actor_id": "ACT-005",
            "first_seen": "2025-06-18T16:40:00Z",
        },
        {
            "id": "INF-004",
            "onion_id": "ONION-004",
            "onion_address": "vaultstall.onion",
            "clearnet_domain": "vault-mirror.example.test",
            "ssl_cn": "vault-mirror.example.test",
            "ssl_fingerprint": "SYNTH-CERT-EE55FF66",
            "server_banner": "LiteSpeed",
            "misconfig": "default admin banner",
            "descriptor_anomaly": None,
            "actor_id": "ACT-010",
            "first_seen": "2025-07-01T08:10:00Z",
        },
        {
            "id": "INF-005",
            "onion_id": "ONION-005",
            "onion_address": "bannershop.onion",
            "clearnet_domain": "banner-shop.example.test",
            "ssl_cn": "banner-shop.example.test",
            "ssl_fingerprint": "SYNTH-CERT-1212ABAB",
            "server_banner": "Apache/2.4.x",
            "misconfig": "directory listing enabled",
            "descriptor_anomaly": "intro point reuse",
            "actor_id": "ACT-017",
            "first_seen": "2025-08-14T13:00:00Z",
        },
        {
            "id": "INF-006",
            "onion_id": "ONION-006",
            "onion_address": "descmis.onion",
            "clearnet_domain": None,
            "ssl_cn": None,
            "ssl_fingerprint": None,
            "server_banner": "OpenSSH_8.x",
            "misconfig": None,
            "descriptor_anomaly": "descriptor identity mismatch",
            "actor_id": "ACT-018",
            "first_seen": "2025-09-03T19:22:00Z",
        },
        {
            "id": "INF-007",
            "onion_id": "ONION-007",
            "onion_address": "echoindex.onion",
            "clearnet_domain": "echo.example.test",
            "ssl_cn": "echo.example.test",
            "ssl_fingerprint": "SYNTH-CERT-9988AA77",
            "server_banner": "Caddy",
            "misconfig": "debug header leak",
            "descriptor_anomaly": None,
            "actor_id": "ACT-011",
            "first_seen": "2025-09-21T10:05:00Z",
        },
        {
            "id": "INF-008",
            "onion_id": "ONION-008",
            "onion_address": "batchkey.onion",
            "clearnet_domain": "demo.example.test",
            "ssl_cn": "demo.example.test",
            "ssl_fingerprint": "SYNTH-CERT-AA11BB22",
            "server_banner": "Apache/2.4.x",
            "misconfig": "server-status exposed",
            "descriptor_anomaly": "shared cert with ONION-001",
            "actor_id": "ACT-014",
            "first_seen": "2025-10-02T07:40:00Z",
        },
        {
            "id": "INF-009",
            "onion_id": "ONION-009",
            "onion_address": "alphalot.onion",
            "clearnet_domain": "lot-alpha.example.test",
            "ssl_cn": "lot-family.example.test",
            "ssl_fingerprint": "SYNTH-CERT-LOT15",
            "server_banner": "nginx/1.22.x",
            "misconfig": None,
            "descriptor_anomaly": None,
            "actor_id": "ACT-015",
            "first_seen": "2025-11-11T12:12:00Z",
        },
        {
            "id": "INF-010",
            "onion_id": "ONION-010",
            "onion_address": "betalot.onion",
            "clearnet_domain": "lot-beta.example.test",
            "ssl_cn": "lot-family.example.test",
            "ssl_fingerprint": "SYNTH-CERT-LOT15",
            "server_banner": "nginx/1.22.x",
            "misconfig": None,
            "descriptor_anomaly": None,
            "actor_id": "ACT-016",
            "first_seen": "2025-11-12T12:40:00Z",
        },
        {
            "id": "INF-011",
            "onion_id": "ONION-011",
            "onion_address": "clockwork.onion",
            "clearnet_domain": None,
            "ssl_cn": None,
            "ssl_fingerprint": None,
            "server_banner": "gunicorn",
            "misconfig": None,
            "descriptor_anomaly": None,
            "actor_id": "ACT-003",
            "first_seen": "2026-01-08T04:00:00Z",
        },
        {
            "id": "INF-012",
            "onion_id": "ONION-012",
            "onion_address": "shifttwin.onion",
            "clearnet_domain": None,
            "ssl_cn": None,
            "ssl_fingerprint": None,
            "server_banner": "gunicorn",
            "misconfig": None,
            "descriptor_anomaly": None,
            "actor_id": "ACT-008",
            "first_seen": "2026-01-09T04:10:00Z",
        },
        {
            "id": "INF-013",
            "onion_id": "ONION-013",
            "onion_address": "quietdrop.onion",
            "clearnet_domain": "quiet.example.test",
            "ssl_cn": "quiet.example.test",
            "ssl_fingerprint": "SYNTH-CERT-QD01",
            "server_banner": "Apache/2.2.x",
            "misconfig": "default service banner",
            "descriptor_anomaly": None,
            "actor_id": "ACT-006",
            "first_seen": "2026-02-02T15:00:00Z",
        },
        {
            "id": "INF-014",
            "onion_id": "ONION-014",
            "onion_address": "nlclerk.onion",
            "clearnet_domain": None,
            "ssl_cn": None,
            "ssl_fingerprint": None,
            "server_banner": "Microsoft-IIS/10.0-SYNTH",
            "misconfig": None,
            "descriptor_anomaly": None,
            "actor_id": "ACT-007",
            "first_seen": "2026-03-14T09:30:00Z",
        },
        {
            "id": "INF-015",
            "onion_id": "ONION-015",
            "onion_address": "awcourier.onion",
            "clearnet_domain": "courier.example.test",
            "ssl_cn": "courier.example.test",
            "ssl_fingerprint": "SYNTH-CERT-AW22",
            "server_banner": "nginx/1.20.x",
            "misconfig": None,
            "descriptor_anomaly": None,
            "actor_id": "ACT-022",
            "first_seen": "2026-04-01T18:18:00Z",
        },
    ]

    for rec in infra:
        timeline.append(
            {
                "id": f"TL-{len(timeline)+1:04d}",
                "actor_id": rec["actor_id"],
                "event_type": "infrastructure_indicator",
                "label": f"Infrastructure {rec['onion_address']} catalogued",
                "timestamp": rec["first_seen"],
                "related_entity_id": rec["id"],
            }
        )

    post_templates = {
        "ACT-001": PHRASES_A,
        "ACT-014": PHRASES_A,
        "ACT-002": PHRASES_B,
        "ACT-003": PHRASES_C,
        "ACT-008": PHRASES_C,
        "ACT-015": ["lot settlement same window", "family cert stays"],
        "ACT-016": ["lot settlement same window", "family cert stays"],
    }

    def post_body(actor_id: str, n: int) -> str:
        phrases = post_templates.get(actor_id, ["routine listing update", "stock check"])
        base = phrases[n % len(phrases)]
        if actor_id == "ACT-001" and n > 3:
            return (
                f"{base}. Rebrand complete. Same signing key. "
                f"Batch drops every third cycle. Sample {n}."
            )
        if actor_id == "ACT-001":
            return f"{base}. Keep the signing key. Sample {n}."
        if actor_id == "ACT-014":
            return f"{base}. Keep the signing key aligned. Sample {n}."
        return f"{base}. Synthetic post {n} for {actor_id}."

    post_n = 1
    for aid, *_ in names:
        count = 6 if aid in ("ACT-001", "ACT-014", "ACT-003", "ACT-008") else 2
        if aid == "ACT-001":
            count = 8
        for i in range(count):
            platform = "PLT-001" if i % 2 == 0 else "PLT-002"
            if aid in ("ACT-003", "ACT-008"):
                platform = "PLT-003"
                hour = 4
            elif aid == "ACT-001":
                hour = 18 if i < 4 else 19
                platform = "PLT-001" if i < 4 else "PLT-002"
            else:
                hour = 12 + (i % 6)
            ts = datetime(2025, 3, 1, hour, 15) + timedelta(days=20 * i + (hash(aid) % 7))
            if aid == "ACT-001" and i >= 4:
                ts = datetime(2026, 3, 10, 19, 0) + timedelta(days=12 * (i - 4))
            pid = f"PST-{post_n:03d}"
            posts.append(
                {
                    "id": pid,
                    "actor_id": aid,
                    "platform_id": platform,
                    "alias": alias_pairs[aid][0] if i < 4 or aid != "ACT-001" else "shadow_reborn",
                    "title": f"Synthetic listing {post_n}",
                    "body": post_body(aid, i),
                    "posted_at": iso(ts),
                }
            )
            timeline.append(
                {
                    "id": f"TL-{len(timeline)+1:04d}",
                    "actor_id": aid,
                    "event_type": "post_published",
                    "label": f"Post {pid} on {platform}",
                    "timestamp": iso(ts),
                    "related_entity_id": pid,
                }
            )
            post_n += 1

    timeline.append(
        {
            "id": f"TL-{len(timeline)+1:04d}",
            "actor_id": "ACT-001",
            "event_type": "persona_migration_candidate",
            "label": "shadow_x activity decline; shadow_reborn activity rise",
            "timestamp": "2026-03-01T00:00:00Z",
            "related_entity_id": "ALS-002",
        }
    )
    timeline.append(
        {
            "id": f"TL-{len(timeline)+1:04d}",
            "actor_id": "ACT-001",
            "event_type": "actor_first_observed",
            "label": "Actor ACT-001 first observed",
            "timestamp": "2025-02-02T18:11:00Z",
            "related_entity_id": "ACT-001",
        }
    )

    def rel(rid: str, src: str, dst: str, rtype: str, explanation: str, confidence: str, evidence_id: str):
        relationships.append(
            {
                "id": rid,
                "source_actor_id": src,
                "target_actor_id": dst,
                "relationship_type": rtype,
                "explanation": explanation,
                "confidence": confidence,
                "evidence_id": evidence_id,
                "timestamp": "2026-09-12T10:00:00Z",
                "source": "Synthetic correlation engine",
            }
        )

    def ev(eid: str, etype: str, src: str, finding: str, status: str, actor_id: str, related: str):
        evidence.append(
            {
                "id": eid,
                "evidence_type": etype,
                "source": src,
                "source_record": related,
                "timestamp": "2026-09-12T10:00:00Z",
                "actor_id": actor_id,
                "related_entities": related,
                "description": finding,
                "status": status,
            }
        )

    # Core ACT-001 cluster
    ev("EVD-001", "PGP Correlation", "Darknet Forum Intercept (Forum-Exploit)", "Direct match on cryptographic PGP public key associated with shadow_x and shadow_reborn.", "supporting", "ACT-001", "PGP-001")
    ev("EVD-002", "Wallet Correlation", "Darknet Marketplace Telemetry", "Identical cryptocurrency wallet address used across Forum-A and Marketplace-B personas.", "supporting", "ACT-001", "WLT-001")
    ev("EVD-003", "Persona Migration", "Temporal activity model", "shadow_x posting declined before shadow_reborn appeared with overlapping style.", "supporting", "ACT-001", "ALS-002")
    ev("EVD-004", "Infrastructure", "Synthetic HS catalogue", "demo123.onion shares SSL CN demo.example.test and Apache banner with batchkey.onion.", "supporting", "ACT-001", "INF-001,INF-008")
    ev("EVD-005", "Stylometry", "Synthetic posts", "TF-IDF and phrase overlap are analytically similar between ACT-001 and ACT-014. Not identity proof.", "supporting", "ACT-001", "ACT-014")
    ev("EVD-006", "Behaviour", "Activity clocks", "ACT-003 and ACT-008 share 04:00 UTC posting windows without shared identifiers.", "supporting", "ACT-003", "ACT-008")
    ev("EVD-007", "Contradicting Identifier", "Identifier set", "ACT-003 and ACT-008 do not share PGP, wallet, or email identifiers.", "contradicting", "ACT-003", "ACT-008")
    ev("EVD-008", "Wallet Correlation", "Synthetic ledger", "ACT-015 and ACT-016 share one synthetic wallet identifier.", "supporting", "ACT-015", "WLT-015")
    ev("EVD-009", "SSL Relationship", "Synthetic cert graph", "lot-alpha and lot-beta onions share SSL CN lot-family.example.test.", "supporting", "ACT-015", "INF-009,INF-010")
    ev("EVD-010", "Isolation", "Negative controls", "ACT-002 identifiers do not overlap the Nexus cluster.", "contradicting", "ACT-002", "ACT-001")

    rel("REL-001", "ACT-001", "ACT-014", "USES_PGP", "Direct match on cryptographic PGP public key observed in two sources.", "HIGH", "EVD-001")
    rel("REL-002", "ACT-001", "ACT-014", "CONNECTED_TO", "Shared synthetic SSL certificate and Apache banner between onions.", "HIGH", "EVD-004")
    rel("REL-003", "ACT-001", "ACT-014", "CORRELATED_WITH", "Writing-style analytical similarity plus shared signing-key phrases.", "MEDIUM", "EVD-005")
    rel("REL-004", "ACT-001", "ACT-001", "MIGRATED_TO", "shadow_x inactivity followed by shadow_reborn with shared PGP and wallet.", "HIGH", "EVD-003")
    rel("REL-005", "ACT-015", "ACT-016", "USES_WALLET", "Exact synthetic wallet identifier match.", "HIGH", "EVD-008")
    rel("REL-006", "ACT-015", "ACT-016", "CONNECTED_TO", "Shared synthetic SSL CN lot-family.example.test.", "HIGH", "EVD-009")
    rel("REL-007", "ACT-003", "ACT-008", "CORRELATED_WITH", "Posting-time similarity only; identifiers diverge.", "LOW", "EVD-006")
    rel("REL-008", "ACT-001", "ACT-002", "CORRELATED_WITH", "Negative control: no shared identifiers.", "LOW", "EVD-010")

    # Expand evidence/relationships to 100+
    ecount = 11
    rcount = 9
    for rec in infra:
        eid = f"EVD-{ecount:03d}"
        finding = (
            f"Hidden service {rec['onion_address']} catalogued with banner "
            f"{rec['server_banner'] or 'n/a'} and misconfig {rec['misconfig'] or 'none'}."
        )
        ev(eid, "Infrastructure Indicator", "Synthetic HS catalogue", finding, "supporting", rec["actor_id"], rec["id"])
        ecount += 1
    for p in pgp:
        eid = f"EVD-{ecount:03d}"
        ev(eid, "PGP Observation", "Darknet Forum Intercept (Forum-Exploit)", f"PGP {p['id']} bound to {p['actor_id']}.", "supporting", p["actor_id"], p["id"])
        ecount += 1
    for w in wallets:
        eid = f"EVD-{ecount:03d}"
        ev(eid, "Wallet Observation", "Darknet Marketplace Telemetry", f"Wallet {w['id']} bound to {w['actor_id']}.", "supporting", w["actor_id"], w["id"])
        ecount += 1
    for a in aliases:
        eid = f"EVD-{ecount:03d}"
        ev(eid, "Alias Observation", "Darknet Forum Intercept (Forum-Exploit)", f"Alias {a['value']} attributed to {a['actor_id']}.", "supporting", a["actor_id"], a["id"])
        ecount += 1
    for pst in posts[:30]:
        eid = f"EVD-{ecount:03d}"
        ev(eid, "Post Record", "Synthetic posts", f"Post {pst['id']} authored under {pst['alias']}.", "supporting", pst["actor_id"], pst["id"])
        ecount += 1

    # extra graph relationships actor-platform
    for aid, *_ in names:
        rid = f"REL-{rcount:03d}"
        rel(rid, aid, aid, "ASSOCIATED_WITH", f"{aid} associated with catalogued platforms in synthetic set.", "MEDIUM", "EVD-001")
        rcount += 1
        rid = f"REL-{rcount:03d}"
        rel(rid, aid, aid, "POSTED_ON", f"{aid} posted on at least one synthetic platform.", "MEDIUM", "EVD-001")
        rcount += 1

    # fill remaining REL to 100+
    while rcount <= 110:
        a = names[rcount % len(names)][0]
        b = names[(rcount * 3) % len(names)][0]
        if a == b:
            b = names[(rcount * 3 + 1) % len(names)][0]
        rid = f"REL-{rcount:03d}"
        rel(
            rid,
            a,
            b,
            "ASSOCIATED_WITH",
            "Weak co-occurrence on GreyIndex directory listings (synthetic).",
            "LOW",
            "EVD-010" if "EVD-010" else evidence[0]["id"],
        )
        rcount += 1

    investigations = [
        {
            "id": "INV-DEMO-001",
            "name": "Nexus Rebrand — shadow_x / shadow_reborn",
            "description": "Demo investigation: correlate shadow_x with shadow_reborn using PGP, wallet, infrastructure, stylometry and behaviour.",
            "search_identifier": "shadow_x",
            "identifier_type": "alias",
            "category": "persona_migration",
            "priority": "high",
            "status": "active",
            "created_at": "2026-09-12T08:00:00Z",
            "actor_ids": ["ACT-001", "ACT-014", "ACT-002"],
            "primary_actor_id": "ACT-001",
        }
    ]

    return {
        "platforms": PLATFORMS,
        "actors": actors,
        "aliases": aliases,
        "usernames": usernames,
        "pgp": pgp,
        "wallets": wallets,
        "emails": emails,
        "posts": posts,
        "infrastructure": infra,
        "relationships": relationships,
        "evidence": evidence,
        "timeline": timeline,
        "investigations": investigations,
        "confidence_weights": {
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
        },
    }


def write_json() -> dict:
    DATA.mkdir(parents=True, exist_ok=True)
    payload = build()
    mapping = {
        "platforms.json": payload["platforms"],
        "actors.json": payload["actors"],
        "aliases.json": payload["aliases"],
        "pgp.json": payload["pgp"],
        "wallets.json": payload["wallets"],
        "posts.json": payload["posts"],
        "infrastructure.json": payload["infrastructure"],
        "relationships.json": payload["relationships"],
        "usernames.json": payload["usernames"],
        "emails.json": payload["emails"],
        "evidence.json": payload["evidence"],
        "timeline.json": payload["timeline"],
        "investigations.json": payload["investigations"],
        "confidence_weights.json": payload["confidence_weights"],
    }
    for name, content in mapping.items():
        (DATA / name).write_text(json.dumps(content, indent=2), encoding="utf-8")
    (DATA / "dataset_manifest.json").write_text(
        json.dumps({k: len(v) if isinstance(v, list) else 1 for k, v in payload.items()}, indent=2),
        encoding="utf-8",
    )
    return payload


if __name__ == "__main__":
    p = write_json()
    print({k: len(v) if isinstance(v, list) else v for k, v in p.items() if k != "confidence_weights"})
