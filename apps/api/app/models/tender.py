import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Float, ForeignKey, Index, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, IDMixin, TimestampMixin
from app.db.types import JSONType, enum_type
from app.models.enums import TenderLifecycle, VerificationStatus


class Tender(IDMixin, TimestampMixin, Base):
    """Unknown values (dates, value, currency) stay NULL and display as 'Not stated'."""

    __tablename__ = "tenders"
    __table_args__ = (Index("ix_tenders_buyer_reference", "buyer_name", "reference_number"),)

    # Set only for private uploads or private invitations: visible to that organization alone.
    organization_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("organizations.id"), index=True)
    source_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("sources.id"), index=True)
    uploaded_by_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))

    buyer_name: Mapped[str | None] = mapped_column(String(255))
    reference_number: Mapped[str | None] = mapped_column(String(255))
    title: Mapped[str] = mapped_column(String(500))
    description: Mapped[str | None] = mapped_column(Text)
    category: Mapped[str | None] = mapped_column(String(255))
    procurement_type: Mapped[str | None] = mapped_column(String(100))
    country: Mapped[str | None] = mapped_column(String(2))
    region: Mapped[str | None] = mapped_column(String(100))
    city: Mapped[str | None] = mapped_column(String(100))

    lifecycle_status: Mapped[TenderLifecycle] = mapped_column(
        enum_type(TenderLifecycle), default=TenderLifecycle.UNKNOWN
    )
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    deadline_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    deadline_timezone: Mapped[str | None] = mapped_column(String(64))  # original timezone, e.g. Asia/Karachi
    estimated_value: Mapped[Decimal | None] = mapped_column(Numeric(18, 2))
    currency: Mapped[str | None] = mapped_column(String(3))

    # Provenance (required by acceptance criteria)
    original_url: Mapped[str | None] = mapped_column(String(2000))
    first_retrieved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_checked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    extraction_confidence: Mapped[float | None] = mapped_column(Float)
    unresolved_fields: Mapped[list | None] = mapped_column(JSONType)
    verification_status: Mapped[VerificationStatus] = mapped_column(
        enum_type(VerificationStatus), default=VerificationStatus.NEEDS_VERIFICATION
    )
    dedup_key: Mapped[str | None] = mapped_column(String(255), index=True)
    deadline_history: Mapped[list | None] = mapped_column(JSONType)  # keeps original + extended deadlines


class TenderVersion(IDMixin, TimestampMixin, Base):
    __tablename__ = "tender_versions"
    __table_args__ = (UniqueConstraint("tender_id", "document_hash"),)

    tender_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenders.id"), index=True)
    version_number: Mapped[int] = mapped_column(Integer, default=1)
    document_hash: Mapped[str] = mapped_column(String(128))
    original_filename: Mapped[str | None] = mapped_column(String(500))
    storage_key: Mapped[str | None] = mapped_column(String(1000))
    retrieved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    superseded_by_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("tender_versions.id"))
    change_summary: Mapped[dict | None] = mapped_column(JSONType)


class Lot(IDMixin, TimestampMixin, Base):
    __tablename__ = "lots"
    __table_args__ = (UniqueConstraint("tender_id", "lot_number"),)

    tender_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenders.id"), index=True)
    lot_number: Mapped[str] = mapped_column(String(50))
    title: Mapped[str | None] = mapped_column(String(500))
    scope: Mapped[str | None] = mapped_column(Text)
    estimated_value: Mapped[Decimal | None] = mapped_column(Numeric(18, 2))
    currency: Mapped[str | None] = mapped_column(String(3))
