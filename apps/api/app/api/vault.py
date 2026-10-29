import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.compliance import EvidenceCreate, EvidenceListOut, EvidenceOut
from app.services.compliance import create_evidence, delete_evidence, list_evidence

router = APIRouter(prefix="/vault", tags=["vault"])


@router.get("", response_model=EvidenceListOut)
def get_vault_documents(
    organization_id: uuid.UUID = Query(..., description="Organization ID"),
    doc_type: str | None = Query(None, description="Filter by document type"),
    db: Session = Depends(get_db),
) -> EvidenceListOut:
    return list_evidence(db, organization_id=organization_id, doc_type=doc_type)


@router.post("", response_model=EvidenceOut)
def upload_vault_document(
    payload: EvidenceCreate,
    organization_id: uuid.UUID = Query(..., description="Organization ID"),
    db: Session = Depends(get_db),
) -> EvidenceOut:
    return create_evidence(db, organization_id=organization_id, payload=payload)


@router.delete("/{evidence_id}")
def remove_vault_document(
    evidence_id: uuid.UUID,
    organization_id: uuid.UUID = Query(..., description="Organization ID"),
    db: Session = Depends(get_db),
) -> dict:
    delete_evidence(db, evidence_id=evidence_id, organization_id=organization_id)
    return {"status": "deleted", "evidence_id": str(evidence_id)}
