import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.enums import BidStage
from app.schemas.bid import (
    BidCreate,
    BidDecisionUpdate,
    BidOut,
    BidStageUpdate,
    PricingLineItemIn,
    PricingScheduleOut,
    TaskCreate,
    TaskOut,
    TaskUpdate,
)
from app.services.bid import (
    calculate_pricing,
    create_bid,
    create_task,
    get_bid_or_404,
    list_bid_tasks,
    list_bids,
    update_bid_decision,
    update_bid_stage,
    update_task,
)

router = APIRouter(prefix="/bids", tags=["bids"])


@router.get("", response_model=list[BidOut])
def get_bids(
    organization_id: uuid.UUID = Query(..., description="Organization ID"),
    stage: BidStage | None = Query(None, description="Filter by bid stage"),
    db: Session = Depends(get_db),
) -> list[BidOut]:
    return list_bids(db, organization_id=organization_id, stage=stage)


@router.post("", response_model=BidOut)
def start_bid(
    payload: BidCreate,
    organization_id: uuid.UUID = Query(..., description="Organization ID"),
    db: Session = Depends(get_db),
) -> BidOut:
    return create_bid(db, organization_id=organization_id, payload=payload)


@router.get("/{bid_id}", response_model=BidOut)
def get_bid(
    bid_id: uuid.UUID,
    organization_id: uuid.UUID = Query(..., description="Organization ID"),
    db: Session = Depends(get_db),
) -> BidOut:
    return get_bid_or_404(db, bid_id=bid_id, organization_id=organization_id)


@router.put("/{bid_id}/stage", response_model=BidOut)
def change_bid_stage(
    bid_id: uuid.UUID,
    payload: BidStageUpdate,
    organization_id: uuid.UUID = Query(..., description="Organization ID"),
    db: Session = Depends(get_db),
) -> BidOut:
    return update_bid_stage(db, bid_id=bid_id, organization_id=organization_id, new_stage=payload.stage)


@router.put("/{bid_id}/decision", response_model=BidOut)
def record_decision(
    bid_id: uuid.UUID,
    payload: BidDecisionUpdate,
    organization_id: uuid.UUID = Query(..., description="Organization ID"),
    db: Session = Depends(get_db),
) -> BidOut:
    return update_bid_decision(db, bid_id=bid_id, organization_id=organization_id, payload=payload)


@router.get("/{bid_id}/tasks", response_model=list[TaskOut])
def get_tasks_for_bid(
    bid_id: uuid.UUID,
    organization_id: uuid.UUID = Query(..., description="Organization ID"),
    db: Session = Depends(get_db),
) -> list[TaskOut]:
    return list_bid_tasks(db, organization_id=organization_id, bid_id=bid_id)


@router.post("/{bid_id}/tasks", response_model=TaskOut)
def add_bid_task(
    bid_id: uuid.UUID,
    payload: TaskCreate,
    organization_id: uuid.UUID = Query(..., description="Organization ID"),
    db: Session = Depends(get_db),
) -> TaskOut:
    return create_task(db, organization_id=organization_id, bid_id=bid_id, payload=payload)


@router.put("/tasks/{task_id}", response_model=TaskOut)
def modify_task(
    task_id: uuid.UUID,
    payload: TaskUpdate,
    organization_id: uuid.UUID = Query(..., description="Organization ID"),
    db: Session = Depends(get_db),
) -> TaskOut:
    return update_task(db, task_id=task_id, organization_id=organization_id, payload=payload)


@router.post("/pricing/calculate", response_model=PricingScheduleOut)
def calculate_pricing_schedule(
    items: list[PricingLineItemIn],
    currency: str = Query("PKR", description="Commercial currency"),
) -> PricingScheduleOut:
    return calculate_pricing(items, currency=currency)
