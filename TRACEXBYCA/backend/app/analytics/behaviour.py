from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime

from sqlalchemy.orm import Session

from app.models import Post


def hour_vector(db: Session, actor_id: str) -> dict:
    posts = db.query(Post).filter(Post.actor_id == actor_id).all()
    vec = [0.0] * 24
    for p in posts:
        vec[p.posted_at.hour] += 1
    return {"vector": vec, "count": len(posts)}


def profile_actor(db: Session, actor_id: str, platform_id: str | None = None) -> dict:
    q = db.query(Post).filter(Post.actor_id == actor_id)
    if platform_id:
        q = q.filter(Post.platform_id == platform_id)
    posts = q.order_by(Post.posted_at).all()
    if not posts:
        return {
            "actor_id": actor_id,
            "post_count": 0,
            "heatmap": [[0] * 24 for _ in range(7)],
            "frequency": [],
            "platforms": {},
            "bursts": [],
            "inactivity_gaps": [],
            "peak_hour": None,
            "summary": "No synthetic posts available for behavioural profiling.",
        }

    heatmap = [[0] * 24 for _ in range(7)]
    platforms: dict[str, int] = defaultdict(int)
    by_day: Counter[str] = Counter()
    hours: Counter[int] = Counter()
    for p in posts:
        heatmap[p.posted_at.weekday()][p.posted_at.hour] += 1
        platforms[p.platform_id or "unknown"] += 1
        by_day[p.posted_at.date().isoformat()] += 1
        hours[p.posted_at.hour] += 1

    dates = sorted(datetime.fromisoformat(d) for d in by_day)
    gaps = []
    bursts = []
    for i in range(1, len(dates)):
        delta = (dates[i] - dates[i - 1]).days
        if delta >= 20:
            gaps.append({"from": dates[i - 1].date().isoformat(), "to": dates[i].date().isoformat(), "days": delta})
    for day, c in by_day.items():
        if c >= 2:
            bursts.append({"day": day, "posts": c})

    peak_hour = hours.most_common(1)[0][0]
    span_days = max(1, (posts[-1].posted_at - posts[0].posted_at).days)
    freq = len(posts) / span_days
    summary = (
        f"{len(posts)} synthetic posts across {len(platforms)} platforms. "
        f"Peak hour {peak_hour:02d}:00 UTC. {len(gaps)} inactivity gap(s)."
    )
    return {
        "actor_id": actor_id,
        "post_count": len(posts),
        "heatmap": heatmap,
        "frequency": [{"date": d, "count": c} for d, c in sorted(by_day.items())],
        "platforms": dict(platforms),
        "bursts": bursts,
        "inactivity_gaps": gaps,
        "peak_hour": peak_hour,
        "posting_frequency": round(freq, 3),
        "first": posts[0].posted_at.isoformat(),
        "last": posts[-1].posted_at.isoformat(),
        "summary": summary,
        "hour_vector": hour_vector(db, actor_id)["vector"],
    }
