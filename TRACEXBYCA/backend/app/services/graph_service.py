from __future__ import annotations

from app.config import get_settings
from sqlalchemy.orm import Session

from app.models import (
    Actor,
    Alias,
    EmailIdentifier,
    Evidence,
    Infrastructure,
    PgpIdentifier,
    Platform,
    Post,
    Relationship,
    Username,
    WalletIdentifier,
)


def _driver():
    settings = get_settings()
    try:
        from neo4j import GraphDatabase

        return GraphDatabase.driver(settings.neo4j_uri, auth=(settings.neo4j_user, settings.neo4j_password))
    except Exception:
        return None


def sync_graph(db: Session) -> dict:
    driver = _driver()
    if driver is None:
        return {"status": "skipped", "reason": "neo4j driver unavailable"}
    try:
        with driver.session() as session:
            session.run("MATCH (n) DETACH DELETE n")
            for a in db.query(Actor).all():
                session.run(
                    "MERGE (n:Actor {id:$id}) SET n.display_name=$name, n.risk=$risk",
                    id=a.id,
                    name=a.display_name,
                    risk=a.risk_band,
                )
            for p in db.query(Platform).all():
                session.run(
                    "MERGE (n:Platform {id:$id}) SET n.name=$name",
                    id=p.id,
                    name=p.name,
                )
            for al in db.query(Alias).all():
                session.run(
                    "MERGE (n:Alias {id:$id}) SET n.value=$value "
                    "WITH n MATCH (a:Actor {id:$aid}) MERGE (a)-[:USES_ALIAS]->(n)",
                    id=al.id,
                    value=al.value,
                    aid=al.actor_id,
                )
            for u in db.query(Username).all():
                session.run(
                    "MERGE (n:Username {id:$id}) SET n.value=$value "
                    "WITH n MATCH (a:Actor {id:$aid}) MERGE (a)-[:ASSOCIATED_WITH]->(n)",
                    id=u.id,
                    value=u.value,
                    aid=u.actor_id,
                )
            for p in db.query(PgpIdentifier).all():
                session.run(
                    "MERGE (n:PGP {id:$id}) SET n.fingerprint=$fp "
                    "WITH n MATCH (a:Actor {id:$aid}) MERGE (a)-[:USES_PGP]->(n)",
                    id=p.id,
                    fp=p.fingerprint,
                    aid=p.actor_id,
                )
            for w in db.query(WalletIdentifier).all():
                session.run(
                    "MERGE (n:Wallet {id:$id}) SET n.address=$addr "
                    "WITH n MATCH (a:Actor {id:$aid}) MERGE (a)-[:USES_WALLET]->(n)",
                    id=w.id,
                    addr=w.address,
                    aid=w.actor_id,
                )
            for e in db.query(EmailIdentifier).all():
                session.run(
                    "MERGE (n:Email {id:$id}) SET n.value=$val "
                    "WITH n MATCH (a:Actor {id:$aid}) MERGE (a)-[:ASSOCIATED_WITH]->(n)",
                    id=e.id,
                    val=e.value,
                    aid=e.actor_id,
                )
            for p in db.query(Post).all():
                session.run(
                    "MERGE (n:Post {id:$id}) SET n.alias=$alias "
                    "WITH n MATCH (a:Actor {id:$aid}) MERGE (a)-[:POSTED_ON]->(n)",
                    id=p.id,
                    alias=p.alias,
                    aid=p.actor_id,
                )
            for i in db.query(Infrastructure).all():
                session.run(
                    "MERGE (n:Infrastructure {id:$id}) SET n.onion=$onion, n.banner=$banner "
                    "WITH n MATCH (a:Actor {id:$aid}) MERGE (a)-[:ASSOCIATED_WITH]->(n)",
                    id=i.id,
                    onion=i.onion_address,
                    banner=i.server_banner,
                    aid=i.actor_id,
                )
                if i.onion_id:
                    session.run(
                        "MERGE (o:OnionService {id:$id}) SET o.address=$addr "
                        "WITH o MATCH (n:Infrastructure {id:$iid}) MERGE (n)-[:HOSTED_ON]->(o)",
                        id=i.onion_id,
                        addr=i.onion_address,
                        iid=i.id,
                    )
                if i.clearnet_domain:
                    session.run(
                        "MERGE (d:ClearnetDomain {id:$id}) SET d.domain=$id "
                        "WITH d MATCH (n:Infrastructure {id:$iid}) MERGE (n)-[:CONNECTED_TO]->(d)",
                        id=i.clearnet_domain,
                        iid=i.id,
                    )
            for e in db.query(Evidence).all():
                session.run(
                    "MERGE (n:Evidence {id:$id}) SET n.type=$type, n.status=$status",
                    id=e.id,
                    type=e.evidence_type,
                    status=e.status,
                )
                if e.actor_id:
                    session.run(
                        "MATCH (a:Actor {id:$aid}), (e:Evidence {id:$eid}) MERGE (a)-[:SUPPORTED_BY]->(e)",
                        aid=e.actor_id,
                        eid=e.id,
                    )
            for r in db.query(Relationship).all():
                rel = r.relationship_type if r.relationship_type.isidentifier() else "CORRELATED_WITH"
                session.run(
                    f"MATCH (a:Actor {{id:$a}}), (b:Actor {{id:$b}}) "
                    f"MERGE (a)-[x:{rel}]->(b) "
                    f"SET x.explanation=$exp, x.confidence=$conf, x.evidence_id=$ev, x.source=$src, x.ts=$ts",
                    a=r.source_actor_id,
                    b=r.target_actor_id,
                    exp=r.explanation,
                    conf=r.confidence,
                    ev=r.evidence_id,
                    src=r.source,
                    ts=r.timestamp.isoformat(),
                )
        driver.close()
        return {"status": "ok"}
    except Exception as exc:
        return {"status": "error", "detail": "Graph sync failed", "error_type": type(exc).__name__}


def actor_graph_from_sql(db: Session, actor_id: str) -> dict:
    nodes: dict[str, dict] = {}
    edges: list[dict] = []

    def add_node(nid: str, label: str, ntype: str, extra: dict | None = None):
        nodes[nid] = {"id": nid, "label": label, "type": ntype, **(extra or {})}

    actor = db.get(Actor, actor_id)
    if not actor:
        return {"nodes": [], "edges": [], "error": "Actor not found"}
    add_node(actor.id, actor.display_name, "Actor")

    for al in db.query(Alias).filter(Alias.actor_id == actor_id):
        add_node(al.id, al.value, "Alias")
        edges.append({"id": f"{actor_id}-{al.id}", "source": actor_id, "target": al.id, "type": "USES_ALIAS", "explanation": f"{actor_id} uses alias {al.value}", "confidence": "HIGH", "origin": "Synthetic catalogue", "timestamp": al.first_seen.isoformat(), "evidence": al.id})
    for p in db.query(PgpIdentifier).filter(PgpIdentifier.actor_id == actor_id):
        add_node(p.id, p.id, "PGP", {"fingerprint": p.fingerprint})
        edges.append({"id": f"{actor_id}-{p.id}", "source": actor_id, "target": p.id, "type": "USES_PGP", "explanation": "Actor bound to synthetic PGP fingerprint", "confidence": "HIGH", "origin": "Synthetic Forum Dataset", "timestamp": p.first_seen.isoformat(), "evidence": p.id})
    for w in db.query(WalletIdentifier).filter(WalletIdentifier.actor_id == actor_id):
        add_node(w.id, w.id, "Wallet")
        edges.append({"id": f"{actor_id}-{w.id}", "source": actor_id, "target": w.id, "type": "USES_WALLET", "explanation": "Actor bound to synthetic wallet identifier", "confidence": "HIGH", "origin": "Synthetic Marketplace Dataset", "timestamp": w.first_seen.isoformat(), "evidence": w.id})
    for e in db.query(EmailIdentifier).filter(EmailIdentifier.actor_id == actor_id):
        add_node(e.id, e.value, "Email")
        edges.append({"id": f"{actor_id}-{e.id}", "source": actor_id, "target": e.id, "type": "ASSOCIATED_WITH", "explanation": "Synthetic email identifier", "confidence": "MEDIUM", "origin": "Synthetic catalogue", "timestamp": e.first_seen.isoformat(), "evidence": e.id})
    for u in db.query(Username).filter(Username.actor_id == actor_id):
        add_node(u.id, u.value, "Username")
        edges.append({"id": f"{actor_id}-{u.id}", "source": actor_id, "target": u.id, "type": "ASSOCIATED_WITH", "explanation": "Username on synthetic platform", "confidence": "MEDIUM", "origin": "Synthetic catalogue", "timestamp": None, "evidence": u.id})
    for i in db.query(Infrastructure).filter(Infrastructure.actor_id == actor_id):
        add_node(i.id, i.onion_address or i.id, "Infrastructure")
        edges.append({"id": f"{actor_id}-{i.id}", "source": actor_id, "target": i.id, "type": "ASSOCIATED_WITH", "explanation": "Hidden-service infrastructure indicator", "confidence": "HIGH", "origin": "Synthetic HS catalogue", "timestamp": i.first_seen.isoformat(), "evidence": i.id})
        if i.onion_id:
            add_node(i.onion_id, i.onion_address or i.onion_id, "OnionService")
            edges.append({"id": f"{i.id}-{i.onion_id}", "source": i.id, "target": i.onion_id, "type": "HOSTED_ON", "explanation": "Infrastructure hosted on onion service", "confidence": "HIGH", "origin": "Synthetic HS catalogue", "timestamp": i.first_seen.isoformat(), "evidence": i.id})
        if i.clearnet_domain:
            add_node(i.clearnet_domain, i.clearnet_domain, "ClearnetDomain")
            edges.append({"id": f"{i.id}-{i.clearnet_domain}", "source": i.id, "target": i.clearnet_domain, "type": "CONNECTED_TO", "explanation": f"SSL/clearnet indicator {i.ssl_cn or i.clearnet_domain}", "confidence": "HIGH", "origin": "Synthetic cert graph", "timestamp": i.first_seen.isoformat(), "evidence": i.id})
    for p in db.query(Post).filter(Post.actor_id == actor_id):
        add_node(p.id, p.id, "Post")
        plat = p.platform_id or "platform"
        add_node(plat, plat, "Platform")
        edges.append({"id": f"{actor_id}-{p.id}", "source": actor_id, "target": p.id, "type": "POSTED_ON", "explanation": f"Post published as {p.alias}", "confidence": "MEDIUM", "origin": "Synthetic posts", "timestamp": p.posted_at.isoformat(), "evidence": p.id})
        edges.append({"id": f"{p.id}-{plat}", "source": p.id, "target": plat, "type": "POSTED_ON", "explanation": "Post on platform", "confidence": "MEDIUM", "origin": "Synthetic posts", "timestamp": p.posted_at.isoformat(), "evidence": p.id})
    for e in db.query(Evidence).filter(Evidence.actor_id == actor_id).limit(40):
        add_node(e.id, e.id, "Evidence", {"status": e.status})
        edges.append({"id": f"{actor_id}-{e.id}", "source": actor_id, "target": e.id, "type": "SUPPORTED_BY", "explanation": e.description, "confidence": "HIGH" if e.status == "supporting" else "LOW", "origin": e.source, "timestamp": e.timestamp.isoformat(), "evidence": e.id})
    for r in db.query(Relationship).filter((Relationship.source_actor_id == actor_id) | (Relationship.target_actor_id == actor_id)):
        other = r.target_actor_id if r.source_actor_id == actor_id else r.source_actor_id
        other_actor = db.get(Actor, other)
        if other_actor:
            add_node(other, other_actor.display_name, "Actor")
        edges.append(
            {
                "id": r.id,
                "source": r.source_actor_id,
                "target": r.target_actor_id,
                "type": r.relationship_type,
                "explanation": r.explanation,
                "confidence": r.confidence,
                "origin": r.source,
                "timestamp": r.timestamp.isoformat(),
                "evidence": r.evidence_id,
            }
        )
        if r.relationship_type == "MIGRATED_TO":
            edges[-1]["type"] = "MIGRATED_TO"
    return {"nodes": list(nodes.values()), "edges": edges, "backend": "postgres-projection"}
