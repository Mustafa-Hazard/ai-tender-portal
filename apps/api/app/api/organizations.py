import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import Context, require_member, require_role
from app.db.session import get_db
from app.models import AuditEvent, Membership, Organization, User
from app.models.enums import Role
from app.schemas.organization import AuditEventOut, MemberCreate, MemberOut, OrganizationOut
from app.services.audit import log_audit_event

router = APIRouter(prefix="/organizations", tags=["organizations"])


@router.get("/me", response_model=OrganizationOut)
def get_my_organization(
    ctx: Context = Depends(require_member),
    db: Session = Depends(get_db),
):
    org = db.scalar(select(Organization).where(Organization.id == ctx.organization_id))
    if org is None:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org


@router.get("/me/members", response_model=List[MemberOut])
def list_members(
    ctx: Context = Depends(require_member),
    db: Session = Depends(get_db),
):
    stmt = (
        select(Membership, User.email, User.full_name)
        .join(User, Membership.user_id == User.id)
        .where(Membership.organization_id == ctx.organization_id)
        .order_by(Membership.created_at)
    )
    results = db.execute(stmt).all()
    out = []
    for membership, email, full_name in results:
        out.append(
            MemberOut(
                id=membership.id,
                user_id=membership.user_id,
                email=email,
                full_name=full_name,
                role=membership.role,
                created_at=membership.created_at,
            )
        )
    return out


@router.post("/me/members", response_model=MemberOut, status_code=201)
def invite_member(
    body: MemberCreate,
    ctx: Context = Depends(require_role([Role.OWNER_ADMIN, Role.BID_MANAGER])),
    db: Session = Depends(get_db),
):
    """Invite or add a team member with an assigned role. Requires OWNER_ADMIN or BID_MANAGER."""
    user = db.scalar(select(User).where(User.email == body.email.lower()))
    if user is None:
        user = User(id=uuid.uuid4(), email=body.email.lower(), full_name=body.full_name)
        db.add(user)
        db.flush()

    existing_membership = db.scalar(
        select(Membership).where(
            Membership.organization_id == ctx.organization_id, Membership.user_id == user.id
        )
    )
    if existing_membership:
        raise HTTPException(status_code=409, detail="User is already a member of this organization")

    membership = Membership(
        id=uuid.uuid4(),
        organization_id=ctx.organization_id,
        user_id=user.id,
        role=body.role,
    )
    db.add(membership)
    db.flush()
    log_audit_event(
        db,
        ctx.organization_id,
        ctx.user_id,
        "organization.member_add",
        "membership",
        str(membership.id),
        before=None,
        after={"email": user.email, "role": body.role.value},
    )
    db.commit()
    return MemberOut(
        id=membership.id,
        user_id=membership.user_id,
        email=user.email,
        full_name=user.full_name,
        role=membership.role,
        created_at=membership.created_at,
    )


@router.get("/me/audit-events", response_model=List[AuditEventOut])
def list_audit_events(
    ctx: Context = Depends(require_role([Role.OWNER_ADMIN, Role.BID_MANAGER, Role.COMPLIANCE, Role.APPROVER])),
    db: Session = Depends(get_db),
):
    """View append-only audit trail for compliance and leadership roles."""
    events = db.scalars(
        select(AuditEvent)
        .where(AuditEvent.organization_id == ctx.organization_id)
        .order_by(AuditEvent.created_at.desc())
        .limit(100)
    ).all()
    return events
