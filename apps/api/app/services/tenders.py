import re
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.api.deps import Context
from app.core.config import settings
from app.models import AuditEvent, Tender
from app.schemas.tender import TenderOut

# Fields that must display as "Not stated" when empty (never zero, never an invented value)
NOT_STATED_FIELDS = (
    "buyer_name", "reference_number", "category", "country",
    "published_at", "deadline_at", "estimated_value", "currency",
)


def visible_to(ctx: Context):
    """Public tenders (no owner) plus the caller's own private uploads."""
    cond = Tender.organization_id.is_(None)
    if ctx.organization_id is not None:
        cond = or_(cond, Tender.organization_id == ctx.organization_id)
    return cond


def make_dedup_key(buyer: str | None, reference: str | None) -> str | None:
    if not buyer or not reference:
        return None
    norm_buyer = re.sub(r"[^a-z0-9]+", "", buyer.lower())
    norm_ref = re.sub(r"[^a-z0-9]+", "", reference.lower())
    if not norm_buyer or not norm_ref:
        return None
    return f"{norm_buyer}:{norm_ref}"


def not_stated_fields(tender: Tender) -> list[str]:
    return [f for f in NOT_STATED_FIELDS if getattr(tender, f) in (None, "")]


def is_stale(tender: Tender) -> bool:
    last = tender.last_checked_at
    if last is None:
        return True
    if last.tzinfo is None:
        last = last.replace(tzinfo=timezone.utc)
    return datetime.now(timezone.utc) - last > timedelta(hours=settings.stale_after_hours)


def to_out(tender: Tender, model=TenderOut):
    out = model.model_validate(tender)
    out.not_stated = not_stated_fields(tender)
    out.stale = is_stale(tender)
    out.is_private = tender.organization_id is not None
    return out


def record_audit(db: Session, ctx: Context, action: str, object_type: str,
                 object_id, before: dict | None, after: dict | None) -> None:
    db.add(
        AuditEvent(
            organization_id=ctx.organization_id,
            actor_id=ctx.user_id,
            action=action,
            object_type=object_type,
            object_id=str(object_id),
            before=before,
            after=after,
        )
    )


def get_visible_tender(db: Session, ctx: Context, tender_id: uuid.UUID) -> Tender | None:
    return db.scalar(select(Tender).where(Tender.id == tender_id, visible_to(ctx)))


def search_tenders(db: Session, ctx: Context, *, q=None, buyer=None, category=None,
                   country=None, region=None, status=None, deadline_after=None,
                   deadline_before=None, min_value=None, max_value=None, source_id=None,
                   sort="deadline", limit=25, offset=0):
    conds = [visible_to(ctx)]
    if q:
        like = f"%{q.strip()}%"
        conds.append(or_(
            Tender.title.ilike(like), Tender.buyer_name.ilike(like),
            Tender.reference_number.ilike(like), Tender.description.ilike(like),
        ))
    if buyer:
        conds.append(Tender.buyer_name.ilike(f"%{buyer.strip()}%"))
    if category:
        conds.append(Tender.category.ilike(f"%{category.strip()}%"))
    if country:
        conds.append(Tender.country == country.upper())
    if region:
        conds.append(Tender.region.ilike(region.strip()))
    if status:
        conds.append(Tender.lifecycle_status == status)
    if deadline_after:
        conds.append(Tender.deadline_at >= deadline_after)
    if deadline_before:
        conds.append(Tender.deadline_at <= deadline_before)
    if min_value is not None:
        conds.append(Tender.estimated_value >= min_value)  # tenders with unknown value are excluded
    if max_value is not None:
        conds.append(Tender.estimated_value <= max_value)
    if source_id:
        conds.append(Tender.source_id == source_id)

    orderings = {
        "deadline": [Tender.deadline_at.asc().nulls_last(), Tender.created_at.desc()],
        "published": [Tender.published_at.desc().nulls_last(), Tender.created_at.desc()],
        "newest": [Tender.created_at.desc()],
    }
    total = db.scalar(select(func.count()).select_from(Tender).where(*conds)) or 0
    rows = db.scalars(
        select(Tender).where(*conds).order_by(*orderings[sort]).limit(limit).offset(offset)
    ).all()
    return rows, total
