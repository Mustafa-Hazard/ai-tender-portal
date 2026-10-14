import uuid
from dataclasses import dataclass

from fastapi import Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.organization import Membership
from app.models.enums import Role


@dataclass
class Context:
    organization_id: uuid.UUID | None
    user_id: uuid.UUID | None
    role: Role | None = None


def _parse_uuid(value: str, name: str) -> uuid.UUID:
    try:
        return uuid.UUID(value)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"{name} must be a valid UUID")


def get_context(
    x_org_id: str | None = Header(default=None),
    x_user_id: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> Context:
    """Multi-tenant context resolved from headers. Enforces that the user belongs to the organization."""
    if x_org_id is None and x_user_id is None:
        return Context(None, None, None)
    if x_org_id is None or x_user_id is None:
        raise HTTPException(status_code=400, detail="Send both X-Org-Id and X-User-Id, or neither")
    org_id = _parse_uuid(x_org_id, "X-Org-Id")
    user_id = _parse_uuid(x_user_id, "X-User-Id")
    role = db.scalar(
        select(Membership.role).where(
            Membership.organization_id == org_id, Membership.user_id == user_id
        )
    )
    if role is None:
        raise HTTPException(status_code=403, detail="User is not a member of this organization")
    return Context(org_id, user_id, role)


def require_member(ctx: Context = Depends(get_context)) -> Context:
    if ctx.organization_id is None or ctx.user_id is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    return ctx


def require_role(allowed_roles: list[Role]):
    def _role_checker(ctx: Context = Depends(require_member)) -> Context:
        if ctx.role not in allowed_roles:
            role_name = ctx.role.value if ctx.role else "unknown"
            raise HTTPException(
                status_code=403,
                detail=f"Permission denied: role '{role_name}' lacks required privileges for this action.",
            )
        return ctx

    return _role_checker
