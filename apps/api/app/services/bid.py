import uuid
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.bid import Bid, Task
from app.models.enums import BidDecision, BidStage, TaskStatus
from app.models.tender import Tender
from app.schemas.bid import (
    BidCreate,
    BidDecisionUpdate,
    BidOut,
    PricingLineItemIn,
    PricingLineItemOut,
    PricingScheduleOut,
    TaskCreate,
    TaskOut,
    TaskUpdate,
)

TWOPLACES = Decimal("0.01")


def _quantize(val: Decimal) -> Decimal:
    return val.quantize(TWOPLACES, rounding=ROUND_HALF_UP)


def calculate_pricing(items_in: list[PricingLineItemIn], currency: str = "PKR") -> PricingScheduleOut:
    """
    RULE 8 ENFORCEMENT: Deterministic Decimal Arithmetic
    All line calculations, discounts, tax schedules, and bid security amounts must use
    exact Decimal arithmetic without floating-point precision loss.
    """
    items_out: list[PricingLineItemOut] = []
    subtotal_net = Decimal("0.00")
    total_tax = Decimal("0.00")

    for item in items_in:
        qty = _quantize(item.quantity)
        price = _quantize(item.selling_price)
        net = _quantize(qty * price)

        tax_rate = item.tax_rate_percent / Decimal("100.00")
        tax = _quantize(net * tax_rate)
        gross = net + tax

        subtotal_net += net
        total_tax += tax

        items_out.append(
            PricingLineItemOut(
                item_code=item.item_code,
                description=item.description,
                quantity=qty,
                unit=item.unit,
                unit_cost=item.unit_cost,
                selling_price=price,
                tax_rate_percent=item.tax_rate_percent,
                net_total=net,
                tax_amount=tax,
                gross_total=gross,
            )
        )

    grand_total = subtotal_net + total_tax
    bid_security_rate = Decimal("2.00")  # 2% standard
    bid_security_amount = _quantize(grand_total * (bid_security_rate / Decimal("100.00")))

    return PricingScheduleOut(
        currency=currency,
        items=items_out,
        subtotal_net=_quantize(subtotal_net),
        total_tax=_quantize(total_tax),
        grand_total=_quantize(grand_total),
        bid_security_rate_percent=bid_security_rate,
        bid_security_amount=bid_security_amount,
    )


def list_bids(db: Session, organization_id: uuid.UUID, stage: BidStage | None = None) -> list[BidOut]:
    stmt = select(Bid).where(Bid.organization_id == organization_id)
    if stage:
        stmt = stmt.where(Bid.stage == stage)
    stmt = stmt.order_by(Bid.updated_at.desc())
    bids = db.execute(stmt).scalars().all()

    outs: list[BidOut] = []
    for b in bids:
        tender = db.execute(select(Tender).where(Tender.id == b.tender_id)).scalar_one_or_none()
        tasks = db.execute(select(Task).where(Task.bid_id == b.id)).scalars().all()
        completed = sum(1 for t in tasks if t.status == TaskStatus.DONE)

        outs.append(
            BidOut(
                id=b.id,
                organization_id=b.organization_id,
                tender_id=b.tender_id,
                tender_title=tender.title if tender else None,
                tender_reference=tender.reference_number if tender else None,
                stage=b.stage,
                decision=b.decision,
                decision_rationale=b.decision_rationale,
                decided_by_id=b.decided_by_id,
                decided_at=b.decided_at,
                decision_review_date=b.decision_review_date,
                owner_id=b.owner_id,
                internal_deadline=b.internal_deadline,
                expected_bid_cost=b.expected_bid_cost,
                potential_contract_value=b.potential_contract_value,
                currency=b.currency,
                tasks_count=len(tasks),
                tasks_completed_count=completed,
                created_at=b.created_at,
                updated_at=b.updated_at,
            )
        )
    return outs


def get_bid_or_404(db: Session, bid_id: uuid.UUID, organization_id: uuid.UUID) -> BidOut:
    b = db.execute(
        select(Bid).where(Bid.id == bid_id, Bid.organization_id == organization_id)
    ).scalar_one_or_none()
    if not b:
        raise HTTPException(status_code=404, detail="Bid not found")

    tender = db.execute(select(Tender).where(Tender.id == b.tender_id)).scalar_one_or_none()
    tasks = db.execute(select(Task).where(Task.bid_id == b.id)).scalars().all()
    completed = sum(1 for t in tasks if t.status == TaskStatus.DONE)

    return BidOut(
        id=b.id,
        organization_id=b.organization_id,
        tender_id=b.tender_id,
        tender_title=tender.title if tender else None,
        tender_reference=tender.reference_number if tender else None,
        stage=b.stage,
        decision=b.decision,
        decision_rationale=b.decision_rationale,
        decided_by_id=b.decided_by_id,
        decided_at=b.decided_at,
        decision_review_date=b.decision_review_date,
        owner_id=b.owner_id,
        internal_deadline=b.internal_deadline,
        expected_bid_cost=b.expected_bid_cost,
        potential_contract_value=b.potential_contract_value,
        currency=b.currency,
        tasks_count=len(tasks),
        tasks_completed_count=completed,
        created_at=b.created_at,
        updated_at=b.updated_at,
    )


def create_bid(db: Session, organization_id: uuid.UUID, payload: BidCreate) -> BidOut:
    existing = db.execute(
        select(Bid).where(Bid.organization_id == organization_id, Bid.tender_id == payload.tender_id)
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="A bid for this tender already exists in your organization")

    bid = Bid(
        organization_id=organization_id,
        tender_id=payload.tender_id,
        stage=payload.stage,
        decision=payload.decision,
        decision_rationale=payload.decision_rationale,
        internal_deadline=payload.internal_deadline,
        expected_bid_cost=payload.expected_bid_cost,
        potential_contract_value=payload.potential_contract_value,
        currency=payload.currency,
    )
    db.add(bid)
    db.commit()
    db.refresh(bid)
    return get_bid_or_404(db, bid.id, organization_id)


def update_bid_stage(db: Session, bid_id: uuid.UUID, organization_id: uuid.UUID, new_stage: BidStage) -> BidOut:
    bid = db.execute(
        select(Bid).where(Bid.id == bid_id, Bid.organization_id == organization_id)
    ).scalar_one_or_none()
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")

    bid.stage = new_stage
    db.commit()
    db.refresh(bid)
    return get_bid_or_404(db, bid.id, organization_id)


def update_bid_decision(
    db: Session, bid_id: uuid.UUID, organization_id: uuid.UUID, payload: BidDecisionUpdate
) -> BidOut:
    bid = db.execute(
        select(Bid).where(Bid.id == bid_id, Bid.organization_id == organization_id)
    ).scalar_one_or_none()
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")

    bid.decision = payload.decision
    bid.decision_rationale = payload.decision_rationale
    bid.decided_at = datetime.now(timezone.utc)
    if payload.decision == BidDecision.BID and bid.stage in [BidStage.DISCOVERED, BidStage.SHORTLISTED, BidStage.EVALUATING]:
        bid.stage = BidStage.PARTICIPATION_APPROVED

    db.commit()
    db.refresh(bid)
    return get_bid_or_404(db, bid.id, organization_id)


def list_bid_tasks(db: Session, organization_id: uuid.UUID, bid_id: uuid.UUID | None = None) -> list[TaskOut]:
    stmt = select(Task).where(Task.organization_id == organization_id)
    if bid_id:
        stmt = stmt.where(Task.bid_id == bid_id)
    stmt = stmt.order_by(Task.due_at.asc().nulls_last())
    tasks = db.execute(stmt).scalars().all()
    return [TaskOut.model_validate(t) for t in tasks]


def create_task(db: Session, organization_id: uuid.UUID, bid_id: uuid.UUID, payload: TaskCreate) -> TaskOut:
    bid = db.execute(
        select(Bid).where(Bid.id == bid_id, Bid.organization_id == organization_id)
    ).scalar_one_or_none()
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")

    task = Task(
        organization_id=organization_id,
        bid_id=bid_id,
        task_type=payload.task_type,
        title=payload.title,
        status=payload.status,
        due_at=payload.due_at,
        notes=payload.notes,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return TaskOut.model_validate(task)


def update_task(db: Session, task_id: uuid.UUID, organization_id: uuid.UUID, payload: TaskUpdate) -> TaskOut:
    task = db.execute(
        select(Task).where(Task.id == task_id, Task.organization_id == organization_id)
    ).scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if payload.status:
        task.status = payload.status
    if payload.notes is not None:
        task.notes = payload.notes

    db.commit()
    db.refresh(task)
    return TaskOut.model_validate(task)
