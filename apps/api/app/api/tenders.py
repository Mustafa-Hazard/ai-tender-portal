import hashlib
import os
import re
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, Depends, File, HTTPException, Query, Response, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import Context, get_context, require_member
from app.core.config import settings
from app.db.session import get_db
from app.models import Lot, Tender, TenderVersion
from app.models.enums import TenderLifecycle
from app.schemas.tender import (
    LotOut, TenderCreate, TenderDetailOut, TenderListOut, TenderOut, VersionOut,
)
from app.services import tenders as svc

router = APIRouter(prefix="/tenders", tags=["tenders"])

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".xlsx", ".xls", ".png", ".jpg", ".jpeg"}
CHUNK_SIZE = 1024 * 1024


def _safe_filename(raw: str | None) -> str:
    name = os.path.basename(raw or "upload")
    name = re.sub(r"[^A-Za-z0-9._-]+", "_", name)[:150]
    return name or "upload"


@router.get("", response_model=TenderListOut)
def list_tenders(
    q: str | None = None,
    buyer: str | None = None,
    category: str | None = None,
    country: str | None = None,
    region: str | None = None,
    status: TenderLifecycle | None = None,
    deadline_after: datetime | None = None,
    deadline_before: datetime | None = None,
    min_value: Decimal | None = None,
    max_value: Decimal | None = None,
    source_id: uuid.UUID | None = None,
    sort: Literal["deadline", "published", "newest"] = "deadline",
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0),
    ctx: Context = Depends(get_context),
    db: Session = Depends(get_db),
):
    rows, total = svc.search_tenders(
        db, ctx, q=q, buyer=buyer, category=category, country=country, region=region,
        status=status, deadline_after=deadline_after, deadline_before=deadline_before,
        min_value=min_value, max_value=max_value, source_id=source_id,
        sort=sort, limit=limit, offset=offset,
    )
    return TenderListOut(
        items=[svc.to_out(t) for t in rows], total=total, limit=limit, offset=offset
    )


@router.get("/{tender_id}", response_model=TenderDetailOut)
def get_tender(
    tender_id: uuid.UUID,
    ctx: Context = Depends(get_context),
    db: Session = Depends(get_db),
):
    tender = svc.get_visible_tender(db, ctx, tender_id)
    if tender is None:
        raise HTTPException(status_code=404, detail="Tender not found")
    out = svc.to_out(tender, TenderDetailOut)
    versions = db.scalars(
        select(TenderVersion).where(TenderVersion.tender_id == tender.id)
        .order_by(TenderVersion.version_number)
    ).all()
    lots = db.scalars(select(Lot).where(Lot.tender_id == tender.id).order_by(Lot.lot_number)).all()
    out.versions = [VersionOut.model_validate(v) for v in versions]
    out.lots = [LotOut.model_validate(lot) for lot in lots]
    return out


@router.post("", response_model=TenderOut, status_code=201)
def create_tender(
    body: TenderCreate,
    ctx: Context = Depends(require_member),
    db: Session = Depends(get_db),
):
    """Manual entry of a private tender opportunity. Provenance is recorded automatically."""
    data = body.model_dump()
    if data.get("country"):
        data["country"] = data["country"].upper()
    if data.get("currency"):
        data["currency"] = data["currency"].upper()

    dedup_key = svc.make_dedup_key(data.get("buyer_name"), data.get("reference_number"))
    if dedup_key:
        existing = db.scalar(
            select(Tender).where(Tender.dedup_key == dedup_key, svc.visible_to(ctx))
        )
        if existing:
            raise HTTPException(
                status_code=409,
                detail={
                    "message": "A tender with the same buyer and reference number already exists",
                    "existing_tender_id": str(existing.id),
                },
            )

    now = datetime.now(timezone.utc)
    tender = Tender(
        **data,
        organization_id=ctx.organization_id,
        uploaded_by_id=ctx.user_id,
        dedup_key=dedup_key,
        first_retrieved_at=now,
        last_checked_at=now,
    )
    tender.unresolved_fields = svc.not_stated_fields(tender)
    if tender.deadline_at:
        tender.deadline_history = [{
            "deadline_at": tender.deadline_at.isoformat(),
            "recorded_at": now.isoformat(),
            "reason": "initial",
        }]
    db.add(tender)
    db.flush()
    svc.record_audit(
        db, ctx, "tender.create", "tender", tender.id, None,
        {"title": tender.title, "reference_number": tender.reference_number},
    )
    db.commit()
    return svc.to_out(tender)


@router.post("/{tender_id}/documents", response_model=VersionOut, status_code=201)
def upload_document(
    tender_id: uuid.UUID,
    response: Response,
    file: UploadFile = File(...),
    ctx: Context = Depends(require_member),
    db: Session = Depends(get_db),
):
    """Attach a document version. Identical content (same SHA-256) is not stored twice."""
    tender = svc.get_visible_tender(db, ctx, tender_id)
    if tender is None:
        raise HTTPException(status_code=404, detail="Tender not found")
    if tender.organization_id != ctx.organization_id:
        raise HTTPException(status_code=403, detail="Only the owning organization can add documents")

    filename = _safe_filename(file.filename)
    if os.path.splitext(filename)[1].lower() not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    max_bytes = settings.max_upload_mb * 1024 * 1024
    dest_dir = Path(settings.storage_dir) / str(ctx.organization_id) / str(tender.id)
    dest_dir.mkdir(parents=True, exist_ok=True)
    tmp_path = dest_dir / f".{uuid.uuid4().hex}.part"

    sha = hashlib.sha256()
    size = 0
    try:
        with open(tmp_path, "wb") as out:
            while chunk := file.file.read(CHUNK_SIZE):
                size += len(chunk)
                if size > max_bytes:
                    raise HTTPException(status_code=413, detail=f"File exceeds {settings.max_upload_mb} MB")
                sha.update(chunk)
                out.write(chunk)
        if size == 0:
            raise HTTPException(status_code=400, detail="File is empty")
    except Exception:
        tmp_path.unlink(missing_ok=True)
        raise

    digest = sha.hexdigest()
    existing = db.scalar(
        select(TenderVersion).where(
            TenderVersion.tender_id == tender.id, TenderVersion.document_hash == digest
        )
    )
    if existing:
        tmp_path.unlink(missing_ok=True)
        response.status_code = 200
        return existing

    # TODO: run malware scan on tmp_path before accepting (brief requires secure upload scanning)
    final_path = dest_dir / f"{digest[:12]}-{filename}"
    tmp_path.replace(final_path)

    previous = db.scalar(
        select(TenderVersion)
        .where(TenderVersion.tender_id == tender.id, TenderVersion.superseded_by_id.is_(None))
        .order_by(TenderVersion.version_number.desc())
    )
    now = datetime.now(timezone.utc)
    version = TenderVersion(
        id=uuid.uuid4(),
        tender_id=tender.id,
        version_number=(previous.version_number + 1) if previous else 1,
        document_hash=digest,
        original_filename=filename,
        storage_key=f"{ctx.organization_id}/{tender.id}/{final_path.name}",
        retrieved_at=now,
    )
    db.add(version)
    db.flush()
    if previous:
        previous.superseded_by_id = version.id  # old version is kept, never overwritten
    tender.last_checked_at = now
    svc.record_audit(
        db, ctx, "tender.document_upload", "tender_version", version.id, None,
        {"tender_id": str(tender.id), "version_number": version.version_number, "sha256": digest},
    )
    db.commit()
    return version
