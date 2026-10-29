from fastapi import FastAPI

from app.api.approvals import router as approvals_router
from app.api.bids import router as bids_router
from app.api.compliance import router as compliance_router
from app.api.connectors import router as connectors_router
from app.api.organizations import router as organizations_router
from app.api.outcomes import router as outcomes_router
from app.api.proposals import router as proposals_router
from app.api.saved_searches import router as saved_searches_router
from app.api.tenders import router as tenders_router
from app.api.vault import router as vault_router
from app.core.config import settings

app = FastAPI(title=settings.app_name, version="0.1.0")
app.include_router(tenders_router, prefix="/api/v1")
app.include_router(organizations_router, prefix="/api/v1")
app.include_router(connectors_router, prefix="/api/v1")
app.include_router(saved_searches_router, prefix="/api/v1")
app.include_router(compliance_router, prefix="/api/v1")
app.include_router(vault_router, prefix="/api/v1")
app.include_router(bids_router, prefix="/api/v1")
app.include_router(approvals_router, prefix="/api/v1")
app.include_router(outcomes_router, prefix="/api/v1")
app.include_router(proposals_router, prefix="/api/v1")


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": settings.app_name}
