import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, IDMixin, utcnow
from app.db.types import JSONType


class AuditEvent(IDMixin, Base):
    """Append-only. No updated_at on purpose: rows are never edited."""

    __tablename__ = "audit_events"

    organization_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("organizations.id"), index=True)
    actor_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    action: Mapped[str] = mapped_column(String(100))
    object_type: Mapped[str] = mapped_column(String(100), index=True)
    object_id: Mapped[str] = mapped_column(String(64), index=True)
    before: Mapped[dict | None] = mapped_column(JSONType)
    after: Mapped[dict | None] = mapped_column(JSONType)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
