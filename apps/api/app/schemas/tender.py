import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field

from app.models.enums import TenderLifecycle, VerificationStatus


class TenderCreate(BaseModel):
    title: str = Field(min_length=3, max_length=500)
    buyer_name: str | None = Field(default=None, max_length=255)
    reference_number: str | None = Field(default=None, max_length=255)
    description: str | None = None
    category: str | None = Field(default=None, max_length=255)
    procurement_type: str | None = Field(default=None, max_length=100)
    country: str | None = Field(default=None, pattern=r"^[A-Za-z]{2}$")
    region: str | None = Field(default=None, max_length=100)
    city: str | None = Field(default=None, max_length=100)
    published_at: AwareDatetime | None = None
    deadline_at: AwareDatetime | None = None  # must include a timezone offset
    deadline_timezone: str | None = Field(default=None, max_length=64)
    estimated_value: Decimal | None = Field(default=None, ge=0, max_digits=18, decimal_places=2)
    currency: str | None = Field(default=None, pattern=r"^[A-Za-z]{3}$")
    original_url: str | None = Field(default=None, max_length=2000)


class TenderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    buyer_name: str | None
    reference_number: str | None
    title: str
    description: str | None
    category: str | None
    procurement_type: str | None
    country: str | None
    region: str | None
    city: str | None
    lifecycle_status: TenderLifecycle
    published_at: datetime | None
    deadline_at: datetime | None
    deadline_timezone: str | None
    estimated_value: Decimal | None
    currency: str | None
    original_url: str | None
    first_retrieved_at: datetime | None
    last_checked_at: datetime | None
    extraction_confidence: float | None
    verification_status: VerificationStatus
    deadline_history: list | None

    # Computed by the API, not stored
    not_stated: list[str] = []
    stale: bool = False
    is_private: bool = False


class VersionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    version_number: int
    document_hash: str
    original_filename: str | None
    retrieved_at: datetime | None
    superseded_by_id: uuid.UUID | None


class LotOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    lot_number: str
    title: str | None
    scope: str | None
    estimated_value: Decimal | None
    currency: str | None


class TenderDetailOut(TenderOut):
    versions: list[VersionOut] = []
    lots: list[LotOut] = []


class TenderListOut(BaseModel):
    items: list[TenderOut]
    total: int
    limit: int
    offset: int
