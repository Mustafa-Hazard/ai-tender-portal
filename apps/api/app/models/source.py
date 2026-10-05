from datetime import datetime

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, IDMixin, TimestampMixin
from app.db.types import enum_type
from app.models.enums import SourceHealth, SourceType


class Source(IDMixin, TimestampMixin, Base):
    __tablename__ = "sources"

    name: Mapped[str] = mapped_column(String(255))
    source_type: Mapped[SourceType] = mapped_column(enum_type(SourceType))
    access_method: Mapped[str | None] = mapped_column(String(100))  # api, feed, permitted_crawl, manual
    base_url: Mapped[str | None] = mapped_column(String(1000))
    refresh_schedule: Mapped[str | None] = mapped_column(String(100))  # cron expression
    last_checked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_success_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    health: Mapped[SourceHealth] = mapped_column(enum_type(SourceHealth), default=SourceHealth.UNKNOWN)
    coverage_notes: Mapped[str | None] = mapped_column(String(2000))
