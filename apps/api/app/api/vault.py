import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import Context, get_context, get_db, resolve_org_id
from app.models.enums import Role
from app.schemas.compliance import EvidenceCreate, EvidenceListOut, EvidenceOut
from app.services.compliance import create_evidence, delete_evidence, list_evidence

router = APIRouter(prefix="/vault", tags=["vault"])


@router.get("", response_model=EvidenceListOut, status_code=status.HTTP_200_OK)
def get_vault_documents(
    organization_id: uuid.UUID | None = Query(None, description="Organization ID (optional if X-Org-Id header is sent)"),
    doc_type: str | None = Query(None, description="Filter by document type"),
    ctx: Context = Depends(get_context),
    db: Session = Depends(get_db),
) -> EvidenceListOut:
    """
    List all compliance evidence records in company vault.
    Calculates dynamic expiration warnings (Rule 7 enforcement).
    """
    org_id = resolve_org_id(ctx, organization_id)
    try:
        return list_evidence(db, organization_id=org_id, doc_type=doc_type)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to query vault documents: {str(e)}",
        )


@router.post("", response_model=EvidenceOut, status_code=status.HTTP_200_OK)
def upload_vault_document(
    payload: EvidenceCreate,
    organization_id: uuid.UUID | None = Query(None, description="Organization ID (optional if X-Org-Id header is sent)"),
    ctx: Context = Depends(get_context),
    db: Session = Depends(get_db),
) -> EvidenceOut:
    """
    Upload and register a new credential, tax certificate, or audit document in company vault.
    """
    org_id = resolve_org_id(ctx, organization_id)
    if ctx.role and ctx.role == Role.VIEWER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied: viewers cannot upload vault documents.",
        )
    try:
        return create_evidence(db, organization_id=org_id, payload=payload)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to register vault document: {str(e)}",
        )


@router.delete("/{evidence_id}", status_code=status.HTTP_200_OK)
def remove_vault_document(
    evidence_id: uuid.UUID,
    organization_id: uuid.UUID | None = Query(None, description="Organization ID (optional if X-Org-Id header is sent)"),
    ctx: Context = Depends(get_context),
    db: Session = Depends(get_db),
) -> dict:
    """
    Remove an obsolete or revoked document from company vault.
    """
    org_id = resolve_org_id(ctx, organization_id)
    if ctx.role and ctx.role not in [Role.OWNER_ADMIN, Role.BID_MANAGER, Role.COMPLIANCE]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission denied: role '{ctx.role.value}' lacks required privileges to delete vault documents.",
        )
    try:
        delete_evidence(db, evidence_id=evidence_id, organization_id=org_id)
        return {"status": "deleted", "evidence_id": str(evidence_id)}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete vault document: {str(e)}",
        )
