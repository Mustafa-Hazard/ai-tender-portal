import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.enums import ComplianceStatus
from app.schemas.compliance import (
    ComplianceMatrixOut,
    RequirementAssessmentOut,
    RequirementAssessmentUpdate,
)
from app.services.compliance import evaluate_compliance_matrix, update_assessment

router = APIRouter(prefix="/compliance", tags=["compliance"])


@router.get("/matrix/{tender_id}", response_model=ComplianceMatrixOut)
def get_compliance_matrix(
    tender_id: uuid.UUID,
    organization_id: uuid.UUID = Query(..., description="Organization ID"),
    db: Session = Depends(get_db),
) -> ComplianceMatrixOut:
    return evaluate_compliance_matrix(db, tender_id=tender_id, organization_id=organization_id)


@router.put("/assessments/{requirement_id}", response_model=RequirementAssessmentOut)
def update_requirement_assessment(
    requirement_id: uuid.UUID,
    payload: RequirementAssessmentUpdate,
    organization_id: uuid.UUID = Query(..., description="Organization ID"),
    db: Session = Depends(get_db),
) -> RequirementAssessmentOut:
    return update_assessment(
        db,
        requirement_id=requirement_id,
        organization_id=organization_id,
        payload=payload,
    )
