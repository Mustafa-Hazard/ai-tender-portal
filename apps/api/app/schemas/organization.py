import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.models.enums import Role


class OrganizationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    registration_country: str | None
    legal_identifiers: dict | None
    business_categories: list | None
    service_regions: list | None
    currencies: list | None
    company_size: str | None
    min_opportunity_value: Decimal | None
    max_opportunity_value: Decimal | None
    profile_completeness: int


class MemberOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    email: str
    full_name: str | None
    role: Role
    created_at: datetime


class MemberCreate(BaseModel):
    email: str
    full_name: str | None = None
    role: Role = Role.VIEWER


class AuditEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID | None
    actor_id: uuid.UUID | None
    action: str
    object_type: str
    object_id: str
    before: dict | None
    after: dict | None
    created_at: datetime
