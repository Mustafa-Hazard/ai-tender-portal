import uuid
from datetime import datetime
from decimal import Decimal
from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, IDMixin, TimestampMixin, utcnow
from app.db.types import JSONType


class OutcomeRecord(IDMixin, TimestampMixin, Base):
    __tablename__ = "outcome_records"
    __table_args__ = (UniqueConstraint("bid_id"),)

    bid_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("bids.id"), index=True)
    organization_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id"), index=True)
    outcome_status: Mapped[str] = mapped_column(String(50))  # awarded, lost, disqualified, cancelled, withdrawn
    awarded_amount: Mapped[Decimal | None] = mapped_column(Numeric(18, 2))
    contract_reference: Mapped[str | None] = mapped_column(String(100))
    winner_name: Mapped[str | None] = mapped_column(String(255))
    winning_bid_amount: Mapped[Decimal | None] = mapped_column(Numeric(18, 2))
    price_variance_percent: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    technical_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    financial_rank: Mapped[int | None] = mapped_column(Integer)  # 1 for L1, 2 for L2, etc.
    debrief_notes: Mapped[str | None] = mapped_column(Text)
    lessons_learned: Mapped[str | None] = mapped_column(Text)
    recorded_by_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
