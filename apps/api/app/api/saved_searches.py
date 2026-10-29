import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import Context, get_context, get_db
from app.models.saved_search import SavedSearch
from app.schemas.saved_search import SavedSearchCreate, SavedSearchListOut, SavedSearchOut, SavedSearchUpdate
from app.schemas.tender import TenderListOut
from app.services.tenders import search_tenders, to_out

router = APIRouter(prefix="/saved-searches", tags=["saved-searches"])


@router.get("", response_model=SavedSearchListOut)
def list_saved_searches(
    db: Session = Depends(get_db),
    ctx: Context = Depends(get_context),
):
    """List saved search queries for caller's organization."""
    if not ctx.organization_id:
        return SavedSearchListOut(items=[], total=0)

    rows = db.scalars(
        select(SavedSearch)
        .where(SavedSearch.organization_id == ctx.organization_id)
        .order_by(SavedSearch.created_at.desc())
    ).all()
    return SavedSearchListOut(items=rows, total=len(rows))


@router.post("", response_model=SavedSearchOut, status_code=status.HTTP_201_CREATED)
def create_saved_search(
    payload: SavedSearchCreate,
    db: Session = Depends(get_db),
    ctx: Context = Depends(get_context),
):
    """Create a new saved search query with alert cadence."""
    if not ctx.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Header 'X-Org-Id' is required to save searches.",
        )

    # Initial dry run to populate matches_count
    f = payload.filters or {}
    _, count = search_tenders(
        db,
        ctx,
        q=f.get("q"),
        buyer=f.get("buyer"),
        category=f.get("category"),
        country=f.get("country"),
        region=f.get("region"),
        status=f.get("status"),
        min_value=f.get("min_value"),
        max_value=f.get("max_value"),
    )

    now = datetime.now(timezone.utc)
    search_obj = SavedSearch(
        id=uuid.uuid4(),
        organization_id=ctx.organization_id,
        user_id=ctx.user_id,
        name=payload.name,
        filters=payload.filters,
        alert_cadence=payload.alert_cadence,
        matches_count=count,
        last_run_at=now,
        is_active=payload.is_active,
    )
    db.add(search_obj)
    db.commit()
    db.refresh(search_obj)
    return search_obj


@router.get("/{search_id}", response_model=SavedSearchOut)
def get_saved_search(
    search_id: uuid.UUID,
    db: Session = Depends(get_db),
    ctx: Context = Depends(get_context),
):
    """Get single saved search."""
    search_obj = db.scalar(
        select(SavedSearch).where(
            SavedSearch.id == search_id,
            SavedSearch.organization_id == ctx.organization_id,
        )
    )
    if not search_obj:
        raise HTTPException(status_code=404, detail="Saved search not found.")
    return search_obj


@router.patch("/{search_id}", response_model=SavedSearchOut)
def update_saved_search(
    search_id: uuid.UUID,
    payload: SavedSearchUpdate,
    db: Session = Depends(get_db),
    ctx: Context = Depends(get_context),
):
    """Update saved search name, filters, alert cadence, or active status."""
    search_obj = db.scalar(
        select(SavedSearch).where(
            SavedSearch.id == search_id,
            SavedSearch.organization_id == ctx.organization_id,
        )
    )
    if not search_obj:
        raise HTTPException(status_code=404, detail="Saved search not found.")

    if payload.name is not None:
        search_obj.name = payload.name
    if payload.filters is not None:
        search_obj.filters = payload.filters
    if payload.alert_cadence is not None:
        search_obj.alert_cadence = payload.alert_cadence
    if payload.is_active is not None:
        search_obj.is_active = payload.is_active

    db.commit()
    db.refresh(search_obj)
    return search_obj


@router.delete("/{search_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_saved_search(
    search_id: uuid.UUID,
    db: Session = Depends(get_db),
    ctx: Context = Depends(get_context),
):
    """Delete a saved search."""
    search_obj = db.scalar(
        select(SavedSearch).where(
            SavedSearch.id == search_id,
            SavedSearch.organization_id == ctx.organization_id,
        )
    )
    if not search_obj:
        raise HTTPException(status_code=404, detail="Saved search not found.")

    db.delete(search_obj)
    db.commit()
    return None


@router.post("/{search_id}/run", response_model=TenderListOut)
def run_saved_search(
    search_id: uuid.UUID,
    limit: int = 25,
    offset: int = 0,
    db: Session = Depends(get_db),
    ctx: Context = Depends(get_context),
):
    """Execute the saved search filters and return matching tenders."""
    search_obj = db.scalar(
        select(SavedSearch).where(
            SavedSearch.id == search_id,
            SavedSearch.organization_id == ctx.organization_id,
        )
    )
    if not search_obj:
        raise HTTPException(status_code=404, detail="Saved search not found.")

    f = search_obj.filters or {}
    items, total = search_tenders(
        db,
        ctx,
        q=f.get("q"),
        buyer=f.get("buyer"),
        category=f.get("category"),
        country=f.get("country"),
        region=f.get("region"),
        status=f.get("status"),
        min_value=f.get("min_value"),
        max_value=f.get("max_value"),
        sort=f.get("sort", "deadline"),
        limit=limit,
        offset=offset,
    )

    # Update metadata
    search_obj.last_run_at = datetime.now(timezone.utc)
    search_obj.matches_count = total
    db.commit()

    return TenderListOut(
        items=[to_out(t) for t in items],
        total=total,
        limit=limit,
        offset=offset,
    )
