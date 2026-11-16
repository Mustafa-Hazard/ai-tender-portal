import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import Context, get_context, get_db, resolve_org_id
from app.models.enums import Role
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


@router.get("/{bid_id}", response_model=list[ApprovalStepOut], status_code=status.HTTP_200_OK)
def get_approval_workflow(
    bid_id: uuid.UUID,
    organization_id: uuid.UUID | None = Query(None, description="Organization ID (optional if X-Org-Id header is sent)"),
    ctx: Context = Depends(get_context),
    db: Session = Depends(get_db),
) -> list[ApprovalStepOut]:
    """
    Retrieve or initialize the multi-stage approval workflow (Technical, Commercial, Compliance, Final).
    """
    org_id = resolve_org_id(ctx, organization_id)
    try:
        return get_or_init_workflow(db, bid_id=bid_id, organization_id=org_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve approval workflow: {str(e)}",
        )


@router.post("/{bid_id}/steps/{step_id}/action", response_model=ApprovalStepOut, status_code=status.HTTP_200_OK)
def record_step_action(
    bid_id: uuid.UUID,
    step_id: uuid.UUID,
    payload: ApprovalActionIn,
    organization_id: uuid.UUID | None = Query(None, description="Organization ID (optional if X-Org-Id header is sent)"),
    ctx: Context = Depends(get_context),
    db: Session = Depends(get_db),
) -> ApprovalStepOut:
    """
    Authorize or reject a specific approval step. Enforces RBAC and invalidates downstream steps on change request.
    """
    org_id = resolve_org_id(ctx, organization_id)
    user_role = ctx.role.value if ctx.role else None
    try:
        return process_step_action(
            db,
            bid_id=bid_id,
            step_id=step_id,
            payload=payload,
            organization_id=org_id,
            user_role=user_role,
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record approval step action: {str(e)}",
        )


@router.get("/{bid_id}/checklist", response_model=SubmissionChecklistOut, status_code=status.HTTP_200_OK)
def get_submission_checklist(
    bid_id: uuid.UUID,
    organization_id: uuid.UUID | None = Query(None, description="Organization ID (optional if X-Org-Id header is sent)"),
    ctx: Context = Depends(get_context),
    db: Session = Depends(get_db),
) -> SubmissionChecklistOut:
    """
    Pre-flight submission gate verification: validates Rule 7 unexpired credentials, Rule 8 pricing,
    all multi-role approvals cleared, and zero blocked milestone tasks.
    """
    org_id = resolve_org_id(ctx, organization_id)
    try:
        return evaluate_submission_checklist(db, bid_id=bid_id, organization_id=org_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to evaluate submission checklist: {str(e)}",
        )


@router.post("/{bid_id}/submit", response_model=SubmissionReceiptOut, status_code=status.HTTP_200_OK)
def finalize_submission(
    bid_id: uuid.UUID,
    payload: SubmissionExecuteIn,
    organization_id: uuid.UUID | None = Query(None, description="Organization ID (optional if X-Org-Id header is sent)"),
    ctx: Context = Depends(get_context),
    db: Session = Depends(get_db),
) -> SubmissionReceiptOut:
    """
    Finalize submission: checks all gates, creates cryptographic package hash and submission manifest,
    and transitions bid status to SUBMITTED.
    """
    org_id = resolve_org_id(ctx, organization_id)
    if ctx.role and ctx.role not in [Role.OWNER_ADMIN, Role.BID_MANAGER, Role.APPROVER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission denied: role '{ctx.role.value}' lacks required privileges to finalize submission.",
        )
    try:
        return submit_bid_package(
            db,
            bid_id=bid_id,
            organization_id=org_id,
            payload=payload,
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to finalize submission: {str(e)}",
        )
