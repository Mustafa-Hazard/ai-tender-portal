import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import Context, get_context, get_db, resolve_org_id
from app.models.enums import Role
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


@router.post("/{bid_id}", response_model=OutcomeRecordOut, status_code=status.HTTP_200_OK)
def record_outcome(
    bid_id: uuid.UUID,
    payload: OutcomeRecordIn,
    organization_id: uuid.UUID | None = Query(None, description="Organization ID (optional if X-Org-Id header is sent)"),
    ctx: Context = Depends(get_context),
    db: Session = Depends(get_db),
) -> OutcomeRecordOut:
    """
    Record final bid outcome (Awarded, Lost, Disqualified, Cancelled, Withdrawn).
    Computes price variance deterministically, updates bid stage, and logs audit event.
    """
    org_id = resolve_org_id(ctx, organization_id)
    if ctx.role and ctx.role not in [Role.OWNER_ADMIN, Role.BID_MANAGER, Role.BUSINESS_DEVELOPMENT]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission denied: role '{ctx.role.value}' lacks required privileges to record bid outcomes.",
        )
    try:
        return record_bid_outcome(db, bid_id=bid_id, organization_id=org_id, payload=payload)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record bid outcome: {str(e)}",
        )


@router.get("", response_model=list[OutcomeRecordOut], status_code=status.HTTP_200_OK)
def get_outcomes(
    organization_id: uuid.UUID | None = Query(None, description="Organization ID (optional if X-Org-Id header is sent)"),
    ctx: Context = Depends(get_context),
    db: Session = Depends(get_db),
) -> list[OutcomeRecordOut]:
    """
    List all recorded win/loss debrief records and outcomes for tenant organization.
    """
    org_id = resolve_org_id(ctx, organization_id)
    try:
        return list_outcomes(db, organization_id=org_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list outcomes: {str(e)}",
        )


@router.get("/analytics/summary", response_model=AnalyticsOverviewOut, status_code=status.HTTP_200_OK)
def get_analytics(
    organization_id: uuid.UUID | None = Query(None, description="Organization ID (optional if X-Org-Id header is sent)"),
    ctx: Context = Depends(get_context),
    db: Session = Depends(get_db),
) -> AnalyticsOverviewOut:
    """
    RULE 14: Compute verified win rate = awarded / (awarded + lost) among decided outcomes.
    Zero outcomes never invents a fictional win rate.
    """
    org_id = resolve_org_id(ctx, organization_id)
    try:
        return get_analytics_overview(db, organization_id=org_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate analytics summary: {str(e)}",
        )


@router.get("/calendar/milestones", response_model=list[CalendarMilestoneOut], status_code=status.HTTP_200_OK)
def get_calendar(
    organization_id: uuid.UUID | None = Query(None, description="Organization ID (optional if X-Org-Id header is sent)"),
    ctx: Context = Depends(get_context),
    db: Session = Depends(get_db),
) -> list[CalendarMilestoneOut]:
    """
    Return unified procurement calendar timeline (submission deadlines, publishing dates, bid milestone tasks).
    """
    org_id = resolve_org_id(ctx, organization_id)
    try:
        return get_calendar_events(db, organization_id=org_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get calendar milestones: {str(e)}",
        )
