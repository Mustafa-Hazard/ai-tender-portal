import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, IDMixin, TimestampMixin
from app.db.types import enum_type
from app.models.enums import BidDecision, BidStage, TaskStatus, TaskType


class Bid(IDMixin, TimestampMixin, Base):
    """Internal participation record. Independent of tender lifecycle: a buyer cancelling keeps our history."""

    __tablename__ = "bids"
    __table_args__ = (UniqueConstraint("organization_id", "tender_id"),)

    organization_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id"), index=True)
    tender_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenders.id"), index=True)
    stage: Mapped[BidStage] = mapped_column(enum_type(BidStage), default=BidStage.DISCOVERED)
    decision: Mapped[BidDecision | None] = mapped_column(enum_type(BidDecision))
    decision_rationale: Mapped[str | None] = mapped_column(Text)
    decided_by_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    decided_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    decision_review_date: Mapped[date | None] = mapped_column(Date)
    owner_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    internal_deadline: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    expected_bid_cost: Mapped[Decimal | None] = mapped_column(Numeric(18, 2))
    potential_contract_value: Mapped[Decimal | None] = mapped_column(Numeric(18, 2))
    currency: Mapped[str | None] = mapped_column(String(3))


class BidLot(Base):
    __tablename__ = "bid_lots"

    bid_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("bids.id"), primary_key=True)
    lot_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("lots.id"), primary_key=True)


class Task(IDMixin, TimestampMixin, Base):
    __tablename__ = "tasks"

    organization_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id"), index=True)
    bid_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("bids.id"), index=True)
    task_type: Mapped[TaskType] = mapped_column(enum_type(TaskType), default=TaskType.OTHER)
    title: Mapped[str] = mapped_column(String(500))
    status: Mapped[TaskStatus] = mapped_column(enum_type(TaskStatus), default=TaskStatus.TODO)
    assignee_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    due_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    notes: Mapped[str | None] = mapped_column(Text)
