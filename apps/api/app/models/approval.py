import uuid
from datetime import datetime
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, IDMixin, TimestampMixin, utcnow
from app.db.types import JSONType


class ApprovalStepRecord(IDMixin, TimestampMixin, Base):
    __tablename__ = "approval_step_records"
    __table_args__ = (UniqueConstraint("bid_id", "flow_type"),)

    bid_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("bids.id"), index=True)
    flow_type: Mapped[str] = mapped_column(String(50))  # technical, commercial, legal_compliance, final
    step_name: Mapped[str] = mapped_column(String(255))
    step_order: Mapped[int] = mapped_column(Integer, default=1)
    required_role: Mapped[str] = mapped_column(String(50))
    status: Mapped[str] = mapped_column(String(50), default="pending")  # pending, approved, changes_requested, rejected, invalidated
    approver_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    approver_name: Mapped[str | None] = mapped_column(String(255))
    decision_notes: Mapped[str | None] = mapped_column(Text)
    decided_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    is_invalidated: Mapped[bool] = mapped_column(Boolean, default=False)


class SubmissionRecord(IDMixin, TimestampMixin, Base):
    __tablename__ = "submission_records"

    bid_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("bids.id"), unique=True, index=True)
    organization_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id"), index=True)
    submission_reference: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    submitted_by_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    submitted_by_name: Mapped[str | None] = mapped_column(String(255))
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    sha256_package_hash: Mapped[str] = mapped_column(String(64))
    package_manifest: Mapped[dict | None] = mapped_column(JSONType)
    status: Mapped[str] = mapped_column(String(50), default="submitted")
