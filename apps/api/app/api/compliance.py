import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import Context, get_context, get_db, resolve_org_id
from app.models.enums import Role
from app.schemas.compliance import (
    ComplianceMatrixOut,
    RequirementAssessmentOut,
    RequirementAssessmentUpdate,
)
from app.services.compliance import evaluate_compliance_matrix, update_assessment

router = APIRouter(prefix="/compliance", tags=["compliance"])


@router.get("/matrix/{tender_id}", response_model=ComplianceMatrixOut, status_code=status.HTTP_200_OK)
def get_compliance_matrix(
    tender_id: uuid.UUID,
    organization_id: uuid.UUID | None = Query(None, description="Organization ID (optional if X-Org-Id header is sent)"),
    ctx: Context = Depends(get_context),
    db: Session = Depends(get_db),
) -> ComplianceMatrixOut:
    """
    Evaluates and returns the compliance matrix for a tender against company vault credentials.
    Calculates 4 separate indicators: mandatory eligibility, coverage, blockers, and readiness.
    """
    org_id = resolve_org_id(ctx, organization_id)
    try:
        return evaluate_compliance_matrix(db, tender_id=tender_id, organization_id=org_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to evaluate compliance matrix: {str(e)}",
        )


@router.put("/assessments/{requirement_id}", response_model=RequirementAssessmentOut, status_code=status.HTTP_200_OK)
def update_requirement_assessment(
    requirement_id: uuid.UUID,
    payload: RequirementAssessmentUpdate,
    organization_id: uuid.UUID | None = Query(None, description="Organization ID (optional if X-Org-Id header is sent)"),
    ctx: Context = Depends(get_context),
    db: Session = Depends(get_db),
) -> RequirementAssessmentOut:
    """
    Updates human-verified reviewer assessment for a specific tender requirement.
    Enforces Rule 6: 'Not Applicable' (N/A) requires a recorded justification.
    """
    org_id = resolve_org_id(ctx, organization_id)
    if ctx.role and ctx.role not in [Role.OWNER_ADMIN, Role.BID_MANAGER, Role.COMPLIANCE, Role.TECHNICAL]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission denied: role '{ctx.role.value}' lacks required privileges to review requirements.",
        )
    try:
        return update_assessment(
            db,
            requirement_id=requirement_id,
            organization_id=org_id,
            payload=payload,
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update requirement assessment: {str(e)}",
        )
