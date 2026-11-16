import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import Context, get_context, get_db, resolve_org_id
from app.models.enums import Role
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


@router.post("", response_model=ProposalOut, status_code=status.HTTP_200_OK)
def init_proposal(
    payload: ProposalCreate,
    organization_id: uuid.UUID | None = Query(None, description="Organization ID (optional if X-Org-Id header is sent)"),
    ctx: Context = Depends(get_context),
    db: Session = Depends(get_db),
) -> ProposalOut:
    """
    Initialize or retrieve existing proposal dossier with canonical sections.
    """
    org_id = resolve_org_id(ctx, organization_id)
    if ctx.role and ctx.role not in [Role.OWNER_ADMIN, Role.BID_MANAGER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission denied: role '{ctx.role.value}' lacks required privileges to initialize proposals.",
        )
    try:
        return get_or_create_proposal(
            db,
            bid_id=payload.bid_id,
            organization_id=org_id,
            title=payload.title,
            template_name=payload.template_name,
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initialize proposal: {str(e)}",
        )


@router.get("/{proposal_id}", response_model=ProposalOut, status_code=status.HTTP_200_OK)
def get_proposal(
    proposal_id: uuid.UUID,
    organization_id: uuid.UUID | None = Query(None, description="Organization ID (optional if X-Org-Id header is sent)"),
    ctx: Context = Depends(get_context),
    db: Session = Depends(get_db),
) -> ProposalOut:
    """
    Retrieve full proposal dossier and its structured sections.
    """
    org_id = resolve_org_id(ctx, organization_id)
    try:
        return get_proposal_by_id(db, proposal_id=proposal_id, organization_id=org_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve proposal: {str(e)}",
        )


@router.post("/{proposal_id}/generate", response_model=ProposalOut, status_code=status.HTTP_200_OK)
def generate_proposal_draft(
    proposal_id: uuid.UUID,
    payload: ProposalGenerateIn,
    organization_id: uuid.UUID | None = Query(None, description="Organization ID (optional if X-Org-Id header is sent)"),
    ctx: Context = Depends(get_context),
    db: Session = Depends(get_db),
) -> ProposalOut:
    """
    Generate grounded proposal draft sections from real tender requirements and company vault evidence.
    Enforces Rule 3 (never invent qualifications; missing evidence yields explicit placeholders).
    """
    org_id = resolve_org_id(ctx, organization_id)
    if ctx.role and ctx.role not in [Role.OWNER_ADMIN, Role.BID_MANAGER, Role.TECHNICAL]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission denied: role '{ctx.role.value}' lacks required privileges to generate proposal content.",
        )
    try:
        return generate_proposal_content(
            db,
            proposal_id=proposal_id,
            organization_id=org_id,
            payload=payload,
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate proposal content: {str(e)}",
        )


@router.put("/{proposal_id}/sections/{section_id}", response_model=ProposalSectionOut, status_code=status.HTTP_200_OK)
def edit_section(
    proposal_id: uuid.UUID,
    section_id: uuid.UUID,
    payload: ProposalSectionUpdate,
    organization_id: uuid.UUID | None = Query(None, description="Organization ID (optional if X-Org-Id header is sent)"),
    ctx: Context = Depends(get_context),
    db: Session = Depends(get_db),
) -> ProposalSectionOut:
    """
    Update human-edited section content, status, or title.
    """
    org_id = resolve_org_id(ctx, organization_id)
    if ctx.role and ctx.role == Role.VIEWER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied: viewers cannot edit proposal sections.",
        )
    try:
        return update_section(
            db,
            proposal_id=proposal_id,
            section_id=section_id,
            organization_id=org_id,
            payload=payload,
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update proposal section: {str(e)}",
        )


@router.get("/{proposal_id}/export", response_model=ProposalExportOut, status_code=status.HTTP_200_OK)
def export_package(
    proposal_id: uuid.UUID,
    envelope_type: str = Query("technical", description="technical or commercial envelope"),
    organization_id: uuid.UUID | None = Query(None, description="Organization ID (optional if X-Org-Id header is sent)"),
    ctx: Context = Depends(get_context),
    db: Session = Depends(get_db),
) -> ProposalExportOut:
    """
    Export submission package. Enforces Rule 10: technical package strictly excludes commercial schedules.
    """
    org_id = resolve_org_id(ctx, organization_id)
    if ctx.role and ctx.role == Role.VIEWER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied: viewers cannot export proposal packages.",
        )
    try:
        return export_proposal_package(
            db,
            proposal_id=proposal_id,
            organization_id=org_id,
            envelope_type=envelope_type,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export proposal package: {str(e)}",
        )
