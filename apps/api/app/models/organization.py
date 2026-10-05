import uuid
from decimal import Decimal

from sqlalchemy import Boolean, ForeignKey, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, IDMixin, TimestampMixin
from app.db.types import JSONType, enum_type
from app.models.enums import Role


class Organization(IDMixin, TimestampMixin, Base):
    __tablename__ = "organizations"

    name: Mapped[str] = mapped_column(String(255))
    registration_country: Mapped[str | None] = mapped_column(String(2))
    legal_identifiers: Mapped[dict | None] = mapped_column(JSONType)  # NTN, SECP no., etc.
    business_categories: Mapped[list | None] = mapped_column(JSONType)
    service_regions: Mapped[list | None] = mapped_column(JSONType)
    currencies: Mapped[list | None] = mapped_column(JSONType)
    company_size: Mapped[str | None] = mapped_column(String(50))
    min_opportunity_value: Mapped[Decimal | None] = mapped_column(Numeric(18, 2))
    max_opportunity_value: Mapped[Decimal | None] = mapped_column(Numeric(18, 2))
    tender_preferences: Mapped[dict | None] = mapped_column(JSONType)
    profile_completeness: Mapped[int] = mapped_column(Integer, default=0)


class User(IDMixin, TimestampMixin, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    full_name: Mapped[str | None] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_platform_admin: Mapped[bool] = mapped_column(Boolean, default=False)


class Membership(IDMixin, TimestampMixin, Base):
    __tablename__ = "memberships"
    __table_args__ = (UniqueConstraint("organization_id", "user_id"),)

    organization_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id"), index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    role: Mapped[Role] = mapped_column(enum_type(Role), default=Role.VIEWER)
