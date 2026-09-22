from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class InvestigationCreate(BaseModel):
    name: str
    description: str = ""
    search_identifier: str
    identifier_type: Literal[
        "username", "alias", "pgp", "wallet", "email", "platform", "onion"
    ]
    category: str = "general"
    priority: Literal["low", "medium", "high"] = "medium"


class ReportExportRequest(BaseModel):
    investigation_id: str
    format: Literal["pdf", "json", "csv"] = "json"


class ConfidenceWeights(BaseModel):
    exact_identifier: float = 0.9
    pgp_match: float = 0.95
    wallet_match: float = 0.9
    email_match: float = 0.85
    infrastructure: float = 0.75
    stylometry: float = 0.55
    behaviour: float = 0.5
    alias_similarity: float = 0.25
    platform_overlap: float = 0.35
    migration: float = 0.7


class ApiError(BaseModel):
    detail: str
    code: str | None = None


class ActorListQuery(BaseModel):
    q: str | None = None
    category: str | None = None
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)
