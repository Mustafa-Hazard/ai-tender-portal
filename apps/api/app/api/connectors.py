from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import Context, get_context, get_db, require_role
from app.models.enums import Role
from app.models.source import Source
from app.services.connectors import AVAILABLE_CONNECTORS

router = APIRouter(prefix="/connectors", tags=["connectors"])


@router.get("", status_code=status.HTTP_200_OK)
def list_connectors(
    db: Session = Depends(get_db),
    ctx: Context = Depends(get_context),
):
    """
    List all registered procurement portal sources and their real health/synchronization status.
    Queries the database 'sources' table for live timestamps, health metrics, and metadata.
    """
    try:
        sources = db.scalars(select(Source).order_by(Source.created_at.desc())).all()
        source_map = {s.name: s for s in sources}

        result = []
        for cid, connector in AVAILABLE_CONNECTORS.items():
            db_source = source_map.get(connector.name)
            # If not yet in database, register or query
            if not db_source:
                db_source = connector.get_or_create_source(db)
                db.commit()
                db.refresh(db_source)

            result.append({
                "id": cid,
                "source_id": str(db_source.id),
                "name": db_source.name,
                "source_type": db_source.source_type.value if hasattr(db_source.source_type, "value") else str(db_source.source_type),
                "access_method": db_source.access_method,
                "jurisdiction": connector.jurisdiction,
                "base_url": db_source.base_url,
                "status": db_source.health.value if hasattr(db_source.health, "value") else str(db_source.health),
                "last_checked_at": db_source.last_checked_at.isoformat() if db_source.last_checked_at else None,
                "last_success_at": db_source.last_success_at.isoformat() if db_source.last_success_at else None,
                "refresh_schedule": db_source.refresh_schedule,
                "coverage_notes": db_source.coverage_notes,
                "is_fictional_sample": True,
            })
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to query portal connectors from database: {str(e)}",
        )


@router.post("/{connector_id}/sync", status_code=status.HTTP_200_OK)
def sync_connector(
    connector_id: str,
    db: Session = Depends(get_db),
    ctx: Context = Depends(get_context),
    _: None = Depends(require_role([Role.OWNER_ADMIN, Role.BID_MANAGER])),
):
    """
    Trigger manual crawl and synchronization for a specific portal connector.
    Persists newly discovered tenders, corrigenda, lots, and versions to the database.
    """
    connector = AVAILABLE_CONNECTORS.get(connector_id)
    if not connector:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Connector '{connector_id}' not found. Available: {', '.join(AVAILABLE_CONNECTORS.keys())}",
        )

    try:
        stats = connector.sync(db, ctx)
        return {
            "status": "success",
            "connector_id": connector_id,
            "metrics": stats,
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Connector synchronization failed: {str(e)}",
        )


@router.post("/sync-all", status_code=status.HTTP_200_OK)
def sync_all_connectors(
    db: Session = Depends(get_db),
    ctx: Context = Depends(get_context),
    _: None = Depends(require_role([Role.OWNER_ADMIN, Role.BID_MANAGER])),
):
    """
    Trigger synchronization across all registered portal connectors in the database.
    """
    results = []
    try:
        for cid, connector in AVAILABLE_CONNECTORS.items():
            stats = connector.sync(db, ctx)
            results.append(stats)
        return {
            "status": "completed",
            "sync_count": len(results),
            "results": results,
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Bulk connector sync failed: {str(e)}",
        )
