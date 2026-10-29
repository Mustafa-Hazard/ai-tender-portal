import uuid
from sqlalchemy.orm import Session

from app.models.audit import AuditEvent


def log_audit_event(
    db: Session,
    organization_id: uuid.UUID | None,
    actor_id: uuid.UUID | None,
    action: str,
    object_type: str,
    object_id: str,
    before: dict | None = None,
    after: dict | None = None,
) -> AuditEvent:
    """Logs an append-only, immutable audit event. Captures actor, action, object, and before/after references."""
    event = AuditEvent(
        organization_id=organization_id,
        actor_id=actor_id,
        action=action,
        object_type=object_type,
        object_id=str(object_id),
        before=before,
        after=after,
    )
    db.add(event)
    db.flush()
    return event
