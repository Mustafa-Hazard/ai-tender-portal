import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.proposal import (
    ProposalCreate,
    ProposalExportOut,
    ProposalGenerateIn,
    ProposalOut,
    ProposalSectionOut,
    ProposalSectionUpdate,
)
from app.services.proposal import (
    export_proposal_package,
    generate_proposal_content,
    get_or_create_proposal,
    get_proposal_by_id,
    update_section,
)

router = APIRouter(prefix="/proposals", tags=["proposals"])


@router.post("", response_model=ProposalOut)
def init_proposal(
    payload: ProposalCreate,
    organization_id: uuid.UUID = Query(..., description="Organization ID"),
    db: Session = Depends(get_db),
) -> ProposalOut:
    return get_or_create_proposal(
        db,
        bid_id=payload.bid_id,
        organization_id=organization_id,
        title=payload.title,
        template_name=payload.template_name,
    )


@router.get("/{proposal_id}", response_model=ProposalOut)
def get_proposal(
    proposal_id: uuid.UUID,
    organization_id: uuid.UUID = Query(..., description="Organization ID"),
    db: Session = Depends(get_db),
) -> ProposalOut:
    return get_proposal_by_id(db, proposal_id=proposal_id, organization_id=organization_id)


@router.post("/{proposal_id}/generate", response_model=ProposalOut)
def generate_proposal_draft(
    proposal_id: uuid.UUID,
    payload: ProposalGenerateIn,
    organization_id: uuid.UUID = Query(..., description="Organization ID"),
    db: Session = Depends(get_db),
) -> ProposalOut:
    return generate_proposal_content(
        db,
        proposal_id=proposal_id,
        organization_id=organization_id,
        payload=payload,
    )


@router.put("/{proposal_id}/sections/{section_id}", response_model=ProposalSectionOut)
def edit_section(
    proposal_id: uuid.UUID,
    section_id: uuid.UUID,
    payload: ProposalSectionUpdate,
    organization_id: uuid.UUID = Query(..., description="Organization ID"),
    db: Session = Depends(get_db),
) -> ProposalSectionOut:
    return update_section(
        db,
        proposal_id=proposal_id,
        section_id=section_id,
        organization_id=organization_id,
        payload=payload,
    )


@router.get("/{proposal_id}/export", response_model=ProposalExportOut)
def export_package(
    proposal_id: uuid.UUID,
    envelope_type: str = Query("technical", description="technical or commercial envelope"),
    organization_id: uuid.UUID = Query(..., description="Organization ID"),
    db: Session = Depends(get_db),
) -> ProposalExportOut:
    return export_proposal_package(
        db,
        proposal_id=proposal_id,
        organization_id=organization_id,
        envelope_type=envelope_type,
    )

