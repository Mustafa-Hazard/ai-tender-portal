import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, IDMixin, TimestampMixin
from app.db.types import enum_type
from app.models.enums import ApprovalState, ComplianceStatus, RequirementKind, RequirementOrigin


class Requirement(IDMixin, TimestampMixin, Base):
    """What the tender asks for. Company-neutral; company answers live in RequirementAssessment."""

    __tablename__ = "requirements"

    tender_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenders.id"), index=True)
    lot_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("lots.id"))  # NULL = applies to whole tender
    tender_version_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("tender_versions.id"))
    code: Mapped[str | None] = mapped_column(String(50))  # requirement ID shown in the matrix
    category: Mapped[str | None] = mapped_column(String(100))
    kind: Mapped[RequirementKind] = mapped_column(enum_type(RequirementKind), default=RequirementKind.MANDATORY)
    original_text: Mapped[str] = mapped_column(Text)
    citation: Mapped[str | None] = mapped_column(String(500))  # page / section reference
    origin: Mapped[RequirementOrigin] = mapped_column(
        enum_type(RequirementOrigin), default=RequirementOrigin.EXTRACTED
    )
    extraction_confidence: Mapped[float | None] = mapped_column(Float)


class Evidence(IDMixin, TimestampMixin, Base):
    """Company document vault entry. A new version is a new row pointing at the one it replaces."""

    __tablename__ = "evidence"

    organization_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id"), index=True)
    doc_type: Mapped[str] = mapped_column(String(100))
    title: Mapped[str] = mapped_column(String(500))
    version: Mapped[int] = mapped_column(Integer, default=1)
    supersedes_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("evidence.id"))
    issuer: Mapped[str | None] = mapped_column(String(255))
    owner_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    issued_on: Mapped[date | None] = mapped_column(Date)
    expires_on: Mapped[date | None] = mapped_column(Date)  # expired evidence must never silently satisfy a requirement
    jurisdiction: Mapped[str | None] = mapped_column(String(100))
    confidentiality: Mapped[str | None] = mapped_column(String(50))
    approval_state: Mapped[ApprovalState] = mapped_column(enum_type(ApprovalState), default=ApprovalState.DRAFT)
    storage_key: Mapped[str | None] = mapped_column(String(1000))
    sha256: Mapped[str | None] = mapped_column(String(64))


class RequirementAssessment(IDMixin, TimestampMixin, Base):
    """One organization's answer to one requirement. AI suggestion and human decision stay separate."""

    __tablename__ = "requirement_assessments"
    __table_args__ = (UniqueConstraint("requirement_id", "organization_id"),)

    requirement_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("requirements.id"), index=True)
    organization_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id"), index=True)
    bid_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("bids.id"))
    ai_status: Mapped[ComplianceStatus | None] = mapped_column(enum_type(ComplianceStatus))
    reviewer_status: Mapped[ComplianceStatus] = mapped_column(
        enum_type(ComplianceStatus), default=ComplianceStatus.UNREVIEWED
    )
    evidence_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("evidence.id"))
    owner_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    due_date: Mapped[date | None] = mapped_column(Date)
    notes: Mapped[str | None] = mapped_column(Text)
    not_applicable_justification: Mapped[str | None] = mapped_column(Text)  # required when status is N/A
    reviewed_by_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
