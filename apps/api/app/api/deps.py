import uuid
from dataclasses import dataclass

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.enums import Role
from app.models.organization import Membership, User

security_scheme = HTTPBearer(auto_error=False)


@dataclass
class Context:
    organization_id: uuid.UUID | None
    user_id: uuid.UUID | None
    role: Role | None = None
    is_platform_admin: bool = False
    user_email: str | None = None


def _parse_uuid(value: str, name: str) -> uuid.UUID:
    try:
        return uuid.UUID(value)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"{name} must be a valid UUID")


def get_context(
    bearer: HTTPAuthorizationCredentials | None = Depends(security_scheme),
    x_org_id: str | None = Header(default=None),
    x_user_id: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> Context:
    """
    Multi-tenant context resolved primarily from JWT Bearer token,
    with fallback to X-Org-Id / X-User-Id headers for backward compatibility.
    Enforces active membership in the target organization.
    """
    # 1. First priority: JWT Bearer Token
    if bearer and bearer.credentials:
        payload = decode_access_token(bearer.credentials)
        user_id_str = payload.get("sub")
        if not user_id_str:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
            )
        user_id = uuid.UUID(user_id_str)
        user = db.get(User, user_id)
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account is inactive or not found",
            )

        org_id_str = payload.get("org_id")
        org_id = uuid.UUID(org_id_str) if org_id_str else None

        # If token doesn't have org_id or header specifies one
        if not org_id and x_org_id:
            org_id = _parse_uuid(x_org_id, "X-Org-Id")

        # Resolve role in the target organization
        role = None
        if org_id:
            role = db.scalar(
                select(Membership.role).where(
                    Membership.organization_id == org_id,
                    Membership.user_id == user_id,
                )
            )

        return Context(
            organization_id=org_id,
            user_id=user_id,
            role=role,
            is_platform_admin=user.is_platform_admin,
            user_email=user.email,
        )

    # 2. Fallback: Direct Header Context (for internal/test migration)
    if x_org_id is None and x_user_id is None:
        return Context(None, None, None, False, None)

    if x_org_id is None or x_user_id is None:
        raise HTTPException(
            status_code=400, detail="Send both X-Org-Id and X-User-Id, or provide Authorization Bearer token"
        )

    org_id = _parse_uuid(x_org_id, "X-Org-Id")
    user_id = _parse_uuid(x_user_id, "X-User-Id")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    role = db.scalar(
        select(Membership.role).where(
            Membership.organization_id == org_id,
            Membership.user_id == user_id,
        )
    )
    if role is None and not user.is_platform_admin:
        raise HTTPException(status_code=403, detail="User is not a member of this organization")

    return Context(
        organization_id=org_id,
        user_id=user_id,
        role=role,
        is_platform_admin=user.is_platform_admin,
        user_email=user.email,
    )


def require_member(ctx: Context = Depends(get_context)) -> Context:
    """Requires an authenticated user belonging to an active organization."""
    if ctx.user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required: Please provide a valid Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if ctx.organization_id is None and not ctx.is_platform_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Active organization workspace required.",
        )
    return ctx


def require_role(allowed_roles: list[Role]):
    """
    Enforces strict Role-Based Access Control (RBAC).
    Platform Admins bypass role checks.
    """
    def _role_checker(ctx: Context = Depends(require_member)) -> Context:
        if ctx.is_platform_admin:
            return ctx
        if ctx.role not in allowed_roles:
            role_name = ctx.role.value if ctx.role else "unassigned"
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: role '{role_name}' lacks required privileges for this action.",
            )
        return ctx

    return _role_checker


def require_platform_admin(ctx: Context = Depends(require_member)) -> Context:
    """Enforces that the user has platform administrator privileges."""
    if not ctx.is_platform_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied: Platform Administrator privileges required.",
        )
    return ctx


def resolve_org_id(ctx: Context, query_org_id: uuid.UUID | None = None) -> uuid.UUID:
    """
    Resolves active organization ID from multi-tenant Context or query parameter.
    Guards against cross-tenant tampering when both are provided.
    """
    target = ctx.organization_id or query_org_id
    if target is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required: organization credentials are missing.",
        )
    if ctx.organization_id is not None and query_org_id is not None and ctx.organization_id != query_org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cross-tenant access forbidden: query organization_id does not match authenticated context.",
        )
    return target
