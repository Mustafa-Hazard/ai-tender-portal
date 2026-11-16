import uuid
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import Context, get_context, get_db, resolve_org_id
from app.models.enums import BidStage, Role
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


@router.get("", response_model=list[BidOut], status_code=status.HTTP_200_OK)
def get_bids(
    organization_id: uuid.UUID | None = Query(None, description="Organization ID (optional if X-Org-Id header is sent)"),
    stage: BidStage | None = Query(None, description="Filter by bid stage"),
    ctx: Context = Depends(get_context),
    db: Session = Depends(get_db),
) -> list[BidOut]:
    """
    List all internal bid pursuit records for tenant with milestone task progress.
    """
    org_id = resolve_org_id(ctx, organization_id)
    try:
        return list_bids(db, organization_id=org_id, stage=stage)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to query bids: {str(e)}",
        )


@router.post("", response_model=BidOut, status_code=status.HTTP_200_OK)
def start_bid(
    payload: BidCreate,
    organization_id: uuid.UUID | None = Query(None, description="Organization ID (optional if X-Org-Id header is sent)"),
    ctx: Context = Depends(get_context),
    db: Session = Depends(get_db),
) -> BidOut:
    """
    Initialize a new bid opportunity workflow linked to a visible tender.
    """
    org_id = resolve_org_id(ctx, organization_id)
    if ctx.role and ctx.role not in [Role.OWNER_ADMIN, Role.BID_MANAGER, Role.BUSINESS_DEVELOPMENT]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission denied: role '{ctx.role.value}' lacks required privileges to initialize bids.",
        )
    try:
        return create_bid(db, organization_id=org_id, payload=payload)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initialize bid: {str(e)}",
        )


@router.get("/{bid_id}", response_model=BidOut, status_code=status.HTTP_200_OK)
def get_bid(
    bid_id: uuid.UUID,
    organization_id: uuid.UUID | None = Query(None, description="Organization ID (optional if X-Org-Id header is sent)"),
    ctx: Context = Depends(get_context),
    db: Session = Depends(get_db),
) -> BidOut:
    """
    Retrieve single bid record by ID with linked tender title and task progress.
    """
    org_id = resolve_org_id(ctx, organization_id)
    try:
        return get_bid_or_404(db, bid_id=bid_id, organization_id=org_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve bid {bid_id}: {str(e)}",
        )


@router.put("/{bid_id}/stage", response_model=BidOut, status_code=status.HTTP_200_OK)
def change_bid_stage(
    bid_id: uuid.UUID,
    payload: BidStageUpdate,
    organization_id: uuid.UUID | None = Query(None, description="Organization ID (optional if X-Org-Id header is sent)"),
    ctx: Context = Depends(get_context),
    db: Session = Depends(get_db),
) -> BidOut:
    """
    Update internal bid stage (Discovered -> Evaluating -> Preparing -> Submitted -> Awarded/Lost).
    """
    org_id = resolve_org_id(ctx, organization_id)
    if ctx.role and ctx.role not in [Role.OWNER_ADMIN, Role.BID_MANAGER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission denied: role '{ctx.role.value}' lacks required privileges to update bid stage.",
        )
    try:
        return update_bid_stage(db, bid_id=bid_id, organization_id=org_id, new_stage=payload.stage)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update bid stage: {str(e)}",
        )


@router.put("/{bid_id}/decision", response_model=BidOut, status_code=status.HTTP_200_OK)
def record_decision(
    bid_id: uuid.UUID,
    payload: BidDecisionUpdate,
    organization_id: uuid.UUID | None = Query(None, description="Organization ID (optional if X-Org-Id header is sent)"),
    ctx: Context = Depends(get_context),
    db: Session = Depends(get_db),
) -> BidOut:
    """
    Record formal human Bid / No-Bid gate decision with justification.
    """
    org_id = resolve_org_id(ctx, organization_id)
    if ctx.role and ctx.role not in [Role.OWNER_ADMIN, Role.BID_MANAGER, Role.APPROVER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission denied: role '{ctx.role.value}' lacks required privileges to record bid decision.",
        )
    try:
        return update_bid_decision(db, bid_id=bid_id, organization_id=org_id, payload=payload)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record bid decision: {str(e)}",
        )


@router.get("/{bid_id}/tasks", response_model=list[TaskOut], status_code=status.HTTP_200_OK)
def get_tasks_for_bid(
    bid_id: uuid.UUID,
    organization_id: uuid.UUID | None = Query(None, description="Organization ID (optional if X-Org-Id header is sent)"),
    ctx: Context = Depends(get_context),
    db: Session = Depends(get_db),
) -> list[TaskOut]:
    """
    List preparation milestones and tasks for this bid.
    """
    org_id = resolve_org_id(ctx, organization_id)
    try:
        return list_bid_tasks(db, organization_id=org_id, bid_id=bid_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list tasks for bid: {str(e)}",
        )


@router.post("/{bid_id}/tasks", response_model=TaskOut, status_code=status.HTTP_200_OK)
def add_bid_task(
    bid_id: uuid.UUID,
    payload: TaskCreate,
    organization_id: uuid.UUID | None = Query(None, description="Organization ID (optional if X-Org-Id header is sent)"),
    ctx: Context = Depends(get_context),
    db: Session = Depends(get_db),
) -> TaskOut:
    """
    Create a new milestone or preparation task for this bid.
    """
    org_id = resolve_org_id(ctx, organization_id)
    if ctx.role and ctx.role == Role.VIEWER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied: viewers cannot create tasks.",
        )
    try:
        return create_task(db, organization_id=org_id, bid_id=bid_id, payload=payload)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create task: {str(e)}",
        )


@router.put("/tasks/{task_id}", response_model=TaskOut, status_code=status.HTTP_200_OK)
def modify_task(
    task_id: uuid.UUID,
    payload: TaskUpdate,
    organization_id: uuid.UUID | None = Query(None, description="Organization ID (optional if X-Org-Id header is sent)"),
    ctx: Context = Depends(get_context),
    db: Session = Depends(get_db),
) -> TaskOut:
    """
    Update task status (TODO -> IN_PROGRESS -> BLOCKED -> DONE) and notes.
    """
    org_id = resolve_org_id(ctx, organization_id)
    if ctx.role and ctx.role == Role.VIEWER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied: viewers cannot modify tasks.",
        )
    try:
        return update_task(db, task_id=task_id, organization_id=org_id, payload=payload)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update task: {str(e)}",
        )


@router.post("/pricing/calculate", response_model=PricingScheduleOut, status_code=status.HTTP_200_OK)
def calculate_pricing_schedule(
    items: list[PricingLineItemIn],
    currency: str = Query("PKR", description="Commercial currency"),
    bid_security_rate_percent: Decimal = Query(Decimal("2.00"), description="Bid security rate percentage (e.g. 2.00)"),
) -> PricingScheduleOut:
    """
    RULE 8: Deterministic Decimal Arithmetic for Pricing Schedules.
    Computes net total, tax schedules, grand total, and bid security bond value.
    """
    if not items:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="At least one pricing line item is required.",
        )
    try:
        return calculate_pricing(items, currency=currency, bid_security_rate=bid_security_rate_percent)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Pricing calculation failed: {str(e)}",
        )
