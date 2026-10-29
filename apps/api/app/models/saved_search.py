import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, IDMixin, TimestampMixin
from app.db.types import JSONType


class SavedSearch(IDMixin, TimestampMixin, Base):
    __tablename__ = "saved_searches"

    organization_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id"), index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)

    name: Mapped[str] = mapped_column(String(255))
    filters: Mapped[dict] = mapped_column(JSONType, default=dict)
    alert_cadence: Mapped[str] = mapped_column(String(50), default="daily_digest")  # instant, daily_digest, weekly, disabled
    last_run_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    matches_count: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
