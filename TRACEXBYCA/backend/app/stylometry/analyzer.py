from __future__ import annotations

import math
import re
from collections import Counter

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy.orm import Session

from app.models import Post

WORD_RE = re.compile(r"[a-zA-Z][a-zA-Z0-9_']+")


def _docs(db: Session, actor_id: str) -> list[str]:
    rows = db.query(Post).filter(Post.actor_id == actor_id).order_by(Post.posted_at).all()
    return [r.body for r in rows]


def _join(docs: list[str]) -> str:
    return " ".join(docs) if docs else ""


def _sentence_lens(text: str) -> list[int]:
    parts = re.split(r"[.!?]+", text)
    return [len(WORD_RE.findall(p)) for p in parts if p.strip()]


def _punct_profile(text: str) -> np.ndarray:
    chars = ".,;:!?-"
    n = max(len(text), 1)
    return np.array([text.count(c) / n for c in chars], dtype=float)


def _phrase_set(text: str) -> set[str]:
    words = [w.lower() for w in WORD_RE.findall(text)]
    grams = set()
    for i in range(len(words) - 2):
        grams.add(" ".join(words[i : i + 3]))
    return grams


def _vocab(text: str) -> Counter:
    return Counter(w.lower() for w in WORD_RE.findall(text))


def _cosine_counters(a: Counter, b: Counter) -> float:
    keys = set(a) | set(b)
    if not keys:
        return 0.0
    va = np.array([a[k] for k in keys], dtype=float)
    vb = np.array([b[k] for k in keys], dtype=float)
    na = np.linalg.norm(va)
    nb = np.linalg.norm(vb)
    if na == 0 or nb == 0:
        return 0.0
    return float(np.dot(va, vb) / (na * nb))


def compare_actors(db: Session, actor_a: str, actor_b: str) -> dict:
    da, db_docs = _docs(db, actor_a), _docs(db, actor_b)
    ta, tb = _join(da), _join(db_docs)
    if not ta or not tb:
        return {
            "actor_a": actor_a,
            "actor_b": actor_b,
            "vocabulary": 0.0,
            "sentence_structure": 0.0,
            "punctuation": 0.0,
            "phrase": 0.0,
            "tfidf": 0.0,
            "overall": 0.0,
            "samples": {"actor_a": da[:2], "actor_b": db_docs[:2]},
            "disclaimer": "Analytical similarity only. Not identity proof.",
        }

    vocab = _cosine_counters(_vocab(ta), _vocab(tb))
    la, lb = _sentence_lens(ta), _sentence_lens(tb)
    mean_a = sum(la) / len(la) if la else 0
    mean_b = sum(lb) / len(lb) if lb else 0
    sent = 1 - min(1.0, abs(mean_a - mean_b) / 12)
    pa, pb = _punct_profile(ta), _punct_profile(tb)
    punct = float(1 - min(1.0, np.linalg.norm(pa - pb) * 8))
    sa, sb = _phrase_set(ta), _phrase_set(tb)
    phrase = len(sa & sb) / max(1, len(sa | sb))
    tfidf = 0.0
    try:
        vec = TfidfVectorizer(min_df=1, ngram_range=(1, 2))
        m = vec.fit_transform([ta, tb])
        tfidf = float(cosine_similarity(m[0], m[1])[0][0])
    except ValueError:
        tfidf = 0.0
    overall = 0.25 * vocab + 0.15 * sent + 0.15 * punct + 0.2 * phrase + 0.25 * tfidf
    return {
        "actor_a": actor_a,
        "actor_b": actor_b,
        "vocabulary": round(vocab, 3),
        "sentence_structure": round(sent, 3),
        "punctuation": round(punct, 3),
        "phrase": round(phrase, 3),
        "tfidf": round(tfidf, 3),
        "overall": round(overall, 3),
        "mean_sentence_length": {"actor_a": round(mean_a, 2), "actor_b": round(mean_b, 2)},
        "samples": {"actor_a": da[:3], "actor_b": db_docs[:3]},
        "label": "Potential persona linkage" if overall >= 0.45 else "Weak analytical similarity",
        "disclaimer": "Stylometric similarity is a supporting indicator, not proof of real-world identity.",
    }


def actor_profile(db: Session, actor_id: str) -> dict:
    docs = _docs(db, actor_id)
    text = _join(docs)
    words = [w.lower() for w in WORD_RE.findall(text)]
    freq = Counter(words).most_common(12)
    others = {p.actor_id for p in db.query(Post.actor_id).distinct() if p.actor_id != actor_id}
    comparisons = [compare_actors(db, actor_id, o) for o in sorted(others)]
    comparisons.sort(key=lambda x: x["overall"], reverse=True)
    return {
        "actor_id": actor_id,
        "post_count": len(docs),
        "word_frequency": freq,
        "punctuation_profile": _punct_profile(text).tolist() if text else [],
        "top_comparisons": comparisons[:8],
        "disclaimer": "Analytical similarity only. Not identity proof.",
    }
