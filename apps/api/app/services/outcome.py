import uuid
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.audit import AuditEvent
from app.models.bid import Bid, Task
from app.models.enums import BidStage
from app.models.outcome import OutcomeRecord
from app.models.tender import Tender
from app.schemas.outcome import (
    AnalyticsOverviewOut,
    CalendarMilestoneOut,
    OutcomeRecordIn,
    OutcomeRecordOut,
)

TWOPLACES = Decimal("0.01")


def record_bid_outcome(
    db: Session,
    bid_id: uuid.UUID,
    organization_id: uuid.UUID,
    payload: OutcomeRecordIn,
) -> OutcomeRecordOut:
    bid = db.execute(
        select(Bid).where(Bid.id == bid_id, Bid.organization_id == organization_id)
    ).scalar_one_or_none()
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")

    tender = db.execute(select(Tender).where(Tender.id == bid.tender_id)).scalar_one_or_none()
    status = payload.outcome_status.lower()

    # Calculate price variance if winning amount provided
    price_variance = None
    if bid.potential_contract_value and payload.winning_bid_amount and payload.winning_bid_amount > 0:
        variance = ((bid.potential_contract_value - payload.winning_bid_amount) / payload.winning_bid_amount) * Decimal("100.0")
        price_variance = variance.quantize(TWOPLACES, rounding=ROUND_HALF_UP)

    # Check if existing outcome record
    out_rec = db.execute(select(OutcomeRecord).where(OutcomeRecord.bid_id == bid_id)).scalar_one_or_none()
    now = datetime.now(timezone.utc)

    if out_rec:
        out_rec.outcome_status = status
        out_rec.awarded_amount = payload.awarded_amount
        out_rec.contract_reference = payload.contract_reference
        out_rec.winner_name = payload.winner_name
        out_rec.winning_bid_amount = payload.winning_bid_amount
        out_rec.price_variance_percent = price_variance
        out_rec.technical_score = payload.technical_score
        out_rec.financial_rank = payload.financial_rank
        out_rec.debrief_notes = payload.debrief_notes
        out_rec.lessons_learned = payload.lessons_learned
        out_rec.recorded_at = now
    else:
        out_rec = OutcomeRecord(
            bid_id=bid_id,
            organization_id=organization_id,
            outcome_status=status,
            awarded_amount=payload.awarded_amount,
            contract_reference=payload.contract_reference,
            winner_name=payload.winner_name,
            winning_bid_amount=payload.winning_bid_amount,
            price_variance_percent=price_variance,
            technical_score=payload.technical_score,
            financial_rank=payload.financial_rank,
            debrief_notes=payload.debrief_notes,
            lessons_learned=payload.lessons_learned,
            recorded_at=now,
        )
        db.add(out_rec)

    # Transition bid stage accordingly
    stage_map = {
        "awarded": BidStage.AWARDED,
        "lost": BidStage.LOST,
        "disqualified": BidStage.LOST,
        "cancelled": BidStage.CANCELLED,
        "withdrawn": BidStage.WITHDRAWN,
    }
    if status in stage_map:
        bid.stage = stage_map[status]

    # Audit log
    audit = AuditEvent(
        organization_id=organization_id,
        action="bid_outcome_recorded",
        object_type="bid_outcome",
        object_id=str(bid_id),
        before=None,
        after={
            "outcome_status": status,
            "contract_reference": payload.contract_reference,
            "winner_name": payload.winner_name,
        },
    )
    db.add(audit)

    db.commit()
    db.refresh(out_rec)

    return OutcomeRecordOut(
        id=out_rec.id,
        bid_id=out_rec.bid_id,
        organization_id=out_rec.organization_id,
        outcome_status=out_rec.outcome_status,
        tender_title=tender.title if tender else None,
        tender_ref=tender.reference_number if tender else None,
        awarded_amount=out_rec.awarded_amount,
        contract_reference=out_rec.contract_reference,
        winner_name=out_rec.winner_name,
        winning_bid_amount=out_rec.winning_bid_amount,
        price_variance_percent=out_rec.price_variance_percent,
        technical_score=out_rec.technical_score,
        financial_rank=out_rec.financial_rank,
        debrief_notes=out_rec.debrief_notes,
        lessons_learned=out_rec.lessons_learned,
        recorded_at=out_rec.recorded_at,
    )


def list_outcomes(db: Session, organization_id: uuid.UUID) -> list[OutcomeRecordOut]:
    recs = db.execute(
        select(OutcomeRecord).where(OutcomeRecord.organization_id == organization_id).order_by(OutcomeRecord.recorded_at.desc())
    ).scalars().all()

    outs: list[OutcomeRecordOut] = []
    for r in recs:
        bid = db.execute(select(Bid).where(Bid.id == r.bid_id)).scalar_one_or_none()
        tender = db.execute(select(Tender).where(Tender.id == bid.tender_id)).scalar_one_or_none() if bid else None
        outs.append(
            OutcomeRecordOut(
                id=r.id,
                bid_id=r.bid_id,
                organization_id=r.organization_id,
                outcome_status=r.outcome_status,
                tender_title=tender.title if tender else None,
                tender_ref=tender.reference_number if tender else None,
                awarded_amount=r.awarded_amount,
                contract_reference=r.contract_reference,
                winner_name=r.winner_name,
                winning_bid_amount=r.winning_bid_amount,
                price_variance_percent=r.price_variance_percent,
                technical_score=r.technical_score,
                financial_rank=r.financial_rank,
                debrief_notes=r.debrief_notes,
                lessons_learned=r.lessons_learned,
                recorded_at=r.recorded_at,
            )
        )
    return outs


def get_analytics_overview(db: Session, organization_id: uuid.UUID) -> AnalyticsOverviewOut:
    bids = db.execute(select(Bid).where(Bid.organization_id == organization_id)).scalars().all()
    outcomes = db.execute(select(OutcomeRecord).where(OutcomeRecord.organization_id == organization_id)).scalars().all()

    total_participated = len(bids)
    awarded_count = sum(1 for o in outcomes if o.outcome_status == "awarded")
    lost_count = sum(1 for o in outcomes if o.outcome_status == "lost")
    disqualified_count = sum(1 for o in outcomes if o.outcome_status == "disqualified")

    decided_outcomes = awarded_count + lost_count + disqualified_count
    win_rate = round((awarded_count / decided_outcomes * 100), 1) if decided_outcomes > 0 else 0.0
    disqualification_rate = round((disqualified_count / decided_outcomes * 100), 1) if decided_outcomes > 0 else 0.0

    total_awarded = sum((o.awarded_amount or Decimal("0.00")) for o in outcomes if o.outcome_status == "awarded")
    total_pipeline = sum((b.potential_contract_value or Decimal("0.00")) for b in bids)

    # Deterministic calculation of average price variance/discount across recorded outcomes
    variances = [float(o.price_variance_percent) for o in outcomes if o.price_variance_percent is not None]
    avg_discount = round(sum(variances) / len(variances), 1) if variances else 0.0

    return AnalyticsOverviewOut(
        total_participated=total_participated,
        awarded_count=awarded_count,
        lost_count=lost_count,
        disqualified_count=disqualified_count,
        win_rate_percent=win_rate,
        total_awarded_value=total_awarded,
        total_pipeline_value=total_pipeline,
        average_discount_percent=avg_discount,
        disqualification_rate_percent=disqualification_rate,
    )


def get_calendar_events(db: Session, organization_id: uuid.UUID) -> list[CalendarMilestoneOut]:
    tenders = db.execute(select(Tender)).scalars().all()
    tasks = db.execute(select(Task).where(Task.organization_id == organization_id)).scalars().all()

    events: list[CalendarMilestoneOut] = []

    for t in tenders:
        if t.deadline_at:
            events.append(
                CalendarMilestoneOut(
                    id=f"t-sub-{t.id}",
                    tender_title=t.title,
                    tender_ref=t.reference_number or "REF",
                    event_type="submission_deadline",
                    event_date=t.deadline_at,
                    status=t.lifecycle_status.value if hasattr(t.lifecycle_status, "value") else str(t.lifecycle_status),
                    client=t.category or "Procuring Body",
                )
            )
        if t.published_at:
            events.append(
                CalendarMilestoneOut(
                    id=f"t-pub-{t.id}",
                    tender_title=t.title,
                    tender_ref=t.reference_number or "REF",
                    event_type="published_date",
                    event_date=t.published_at,
                    status="published",
                    client=t.category or "Procuring Body",
                )
            )

    for tk in tasks:
        if tk.due_at:
            events.append(
                CalendarMilestoneOut(
                    id=f"task-{tk.id}",
                    tender_title=tk.title,
                    tender_ref="TASK",
                    event_type=tk.task_type.value if hasattr(tk.task_type, "value") else str(tk.task_type),
                    event_date=tk.due_at,
                    status=tk.status.value if hasattr(tk.status, "value") else str(tk.status),
                    client="Internal Bid Milestone",
                )
            )

    return sorted(events, key=lambda x: str(x.event_date))
