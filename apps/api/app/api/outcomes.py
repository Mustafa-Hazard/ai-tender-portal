import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.outcome import (
    AnalyticsOverviewOut,
    CalendarMilestoneOut,
    OutcomeRecordIn,
    OutcomeRecordOut,
)
from app.services.outcome import (
    get_analytics_overview,
    get_calendar_events,
    list_outcomes,
    record_bid_outcome,
)

router = APIRouter(prefix="/outcomes", tags=["outcomes"])


@router.post("/{bid_id}", response_model=OutcomeRecordOut)
def record_outcome(
    bid_id: uuid.UUID,
    payload: OutcomeRecordIn,
    organization_id: uuid.UUID = Query(..., description="Organization ID"),
    db: Session = Depends(get_db),
) -> OutcomeRecordOut:
    return record_bid_outcome(db, bid_id=bid_id, organization_id=organization_id, payload=payload)


@router.get("", response_model=list[OutcomeRecordOut])
def get_outcomes(
    organization_id: uuid.UUID = Query(..., description="Organization ID"),
    db: Session = Depends(get_db),
) -> list[OutcomeRecordOut]:
    return list_outcomes(db, organization_id=organization_id)


@router.get("/analytics/summary", response_model=AnalyticsOverviewOut)
def get_analytics(
    organization_id: uuid.UUID = Query(..., description="Organization ID"),
    db: Session = Depends(get_db),
) -> AnalyticsOverviewOut:
    return get_analytics_overview(db, organization_id=organization_id)


@router.get("/calendar/milestones", response_model=list[CalendarMilestoneOut])
def get_calendar(
    organization_id: uuid.UUID = Query(..., description="Organization ID"),
    db: Session = Depends(get_db),
) -> list[CalendarMilestoneOut]:
    return get_calendar_events(db, organization_id=organization_id)
