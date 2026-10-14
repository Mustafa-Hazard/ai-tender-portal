from fastapi import FastAPI

from app.api.connectors import router as connectors_router
from app.api.organizations import router as organizations_router
from app.api.saved_searches import router as saved_searches_router
from app.api.tenders import router as tenders_router
from app.core.config import settings

app = FastAPI(title=settings.app_name, version="0.1.0")
app.include_router(tenders_router, prefix="/api/v1")
app.include_router(organizations_router, prefix="/api/v1")
app.include_router(connectors_router, prefix="/api/v1")
app.include_router(saved_searches_router, prefix="/api/v1")


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": settings.app_name}
