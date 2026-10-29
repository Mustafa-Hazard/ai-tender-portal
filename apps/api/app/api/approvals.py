import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import Context, get_context
from app.db.session import get_db
from app.schemas.approval import (
    ApprovalActionIn,
    ApprovalStepOut,
    SubmissionChecklistOut,
    SubmissionExecuteIn,
    SubmissionReceiptOut,
)
from app.services.approval import (
    evaluate_submission_checklist,
    get_or_init_workflow,
    process_step_action,
    submit_bid_package,
)

router = APIRouter(prefix="/approvals", tags=["approvals"])


@router.get("/{bid_id}", response_model=list[ApprovalStepOut])
def get_approval_workflow(
    bid_id: uuid.UUID,
    organization_id: uuid.UUID = Query(..., description="Organization ID"),
    db: Session = Depends(get_db),
) -> list[ApprovalStepOut]:
    return get_or_init_workflow(db, bid_id=bid_id, organization_id=organization_id)


@router.post("/{bid_id}/steps/{step_id}/action", response_model=ApprovalStepOut)
def record_step_action(
    bid_id: uuid.UUID,
    step_id: uuid.UUID,
    payload: ApprovalActionIn,
    organization_id: uuid.UUID = Query(..., description="Organization ID"),
    ctx: Context = Depends(get_context),
    db: Session = Depends(get_db),
) -> ApprovalStepOut:
    if ctx.organization_id and ctx.organization_id != organization_id:
        raise HTTPException(status_code=403, detail="Cross-tenant access forbidden")

    user_role = ctx.role.value if ctx.role else None
    return process_step_action(
        db,
        bid_id=bid_id,
        step_id=step_id,
        payload=payload,
        organization_id=organization_id,
        user_role=user_role,
    )


@router.get("/{bid_id}/checklist", response_model=SubmissionChecklistOut)
def get_submission_checklist(
    bid_id: uuid.UUID,
    organization_id: uuid.UUID = Query(..., description="Organization ID"),
    db: Session = Depends(get_db),
) -> SubmissionChecklistOut:
    return evaluate_submission_checklist(db, bid_id=bid_id, organization_id=organization_id)


@router.post("/{bid_id}/submit", response_model=SubmissionReceiptOut)
def finalize_submission(
    bid_id: uuid.UUID,
    payload: SubmissionExecuteIn,
    organization_id: uuid.UUID = Query(..., description="Organization ID"),
    db: Session = Depends(get_db),
) -> SubmissionReceiptOut:
    return submit_bid_package(
        db,
        bid_id=bid_id,
        organization_id=organization_id,
        payload=payload,
    )
