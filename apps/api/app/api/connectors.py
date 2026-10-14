from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import Context, get_context, get_db, require_role
from app.models.enums import Role
from app.models.source import Source
from app.services.connectors import SampleFederalEProcurementConnector, SampleProvincialPortalConnector

router = APIRouter(prefix="/connectors", tags=["connectors"])

AVAILABLE_CONNECTORS = {
    "federal-epads": SampleFederalEProcurementConnector(),
    "punjab-ppra": SampleProvincialPortalConnector(),
}


@router.get("")
def list_connectors(
    db: Session = Depends(get_db),
    ctx: Context = Depends(get_context),
):
    """List all available source portal connectors with status and last crawl metrics."""
    sources = db.scalars(select(Source)).all()
    source_map = {s.name: s for s in sources}

    result = []
    for cid, connector in AVAILABLE_CONNECTORS.items():
        db_source = source_map.get(connector.name)
        result.append({
            "id": cid,
            "name": connector.name,
            "source_type": connector.source_type.value,
            "jurisdiction": connector.jurisdiction,
            "base_url": connector.base_url,
            "status": db_source.health.value if db_source else "healthy",
            "last_checked_at": db_source.last_checked_at.isoformat() if db_source and db_source.last_checked_at else None,
            "last_success_at": db_source.last_success_at.isoformat() if db_source and db_source.last_success_at else None,
            "is_fictional_sample": True,
        })
    return result


@router.post("/{connector_id}/sync")
def sync_connector(
    connector_id: str,
    db: Session = Depends(get_db),
    ctx: Context = Depends(get_context),
    _: None = Depends(require_role([Role.OWNER_ADMIN, Role.BID_MANAGER])),
):
    """Trigger manual sync for a specific connector."""
    connector = AVAILABLE_CONNECTORS.get(connector_id)
    if not connector:
        raise HTTPException(status_code=404, detail=f"Connector '{connector_id}' not found.")

    stats = connector.sync(db, ctx)
    return {
        "status": "success",
        "connector_id": connector_id,
        "metrics": stats,
    }


@router.post("/sync-all")
def sync_all_connectors(
    db: Session = Depends(get_db),
    ctx: Context = Depends(get_context),
    _: None = Depends(require_role([Role.OWNER_ADMIN, Role.BID_MANAGER])),
):
    """Trigger sync across all registered connectors."""
    results = []
    for cid, connector in AVAILABLE_CONNECTORS.items():
        stats = connector.sync(db, ctx)
        results.append(stats)
    return {
        "status": "completed",
        "sync_count": len(results),
        "results": results,
    }
