import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class SavedSearchCreate(BaseModel):
    name: str
    filters: dict = {}
    alert_cadence: str = "daily_digest"  # instant, daily_digest, weekly, disabled
    is_active: bool = True


class SavedSearchUpdate(BaseModel):
    name: str | None = None
    filters: dict | None = None
    alert_cadence: str | None = None
    is_active: bool | None = None


class SavedSearchOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    user_id: uuid.UUID
    name: str
    filters: dict
    alert_cadence: str
    matches_count: int
    last_run_at: datetime | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class SavedSearchListOut(BaseModel):
    items: list[SavedSearchOut]
    total: int
