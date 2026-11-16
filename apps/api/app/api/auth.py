import uuid
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import Context, get_context, require_member
from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models.enums import Role
from app.models.organization import Membership, Organization, User
from app.schemas.auth import LoginRequest, SignUpRequest, TokenResponse, UserPublic

router = APIRouter(prefix="/auth", tags=["Authentication & RBAC"])


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignUpRequest, db: Session = Depends(get_db)):
    """
    Registers a new user, hashes the password with bcrypt, initializes their
    tenant organization workspace, assigns their initial role, and issues a signed JWT.
    """
    email_clean = payload.email.strip().lower()

    # 1. Check for existing account
    existing = db.scalar(select(User).where(User.email == email_clean))
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    # 2. Create User record with securely hashed password
    new_user = User(
        id=uuid.uuid4(),
        email=email_clean,
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
        is_active=True,
        is_platform_admin=False,
    )
    db.add(new_user)
    db.flush()

    # 3. Create initial organization workspace
    org_name = payload.organization_name.strip() if payload.organization_name else f"{payload.full_name or 'My'} Organization"
    new_org = Organization(
        id=uuid.uuid4(),
        name=org_name,
        registration_country="PK",
        business_categories=[],
        service_regions=[],
        currencies=["PKR"],
        profile_completeness=10,
    )
    db.add(new_org)
    db.flush()

    # 4. Create initial membership
    assigned_role = payload.role if payload.role else Role.OWNER_ADMIN
    membership = Membership(
        id=uuid.uuid4(),
        organization_id=new_org.id,
        user_id=new_user.id,
        role=assigned_role,
    )
    db.add(membership)
    db.commit()

    # 5. Issue JWT access token
    token = create_access_token(
        subject=new_user.id,
        extra_claims={
            "email": new_user.email,
            "org_id": str(new_org.id),
            "role": assigned_role.value,
            "is_platform_admin": False,
        },
    )

    user_public = UserPublic(
        id=new_user.id,
        email=new_user.email,
        full_name=new_user.full_name,
        role=assigned_role,
        organization_id=new_org.id,
        organization_name=new_org.name,
        is_platform_admin=False,
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=user_public,
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticates a user by email and password, verifies the bcrypt hash,
    and returns a signed JWT access token with role and tenant claims.
    """
    email_clean = payload.email.strip().lower()
    user = db.scalar(select(User).where(User.email == email_clean))

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Please contact your organization administrator.",
        )

    # Resolve primary organization membership
    membership = db.scalar(
        select(Membership).where(Membership.user_id == user.id).limit(1)
    )

    org_id = membership.organization_id if membership else None
    role = membership.role if membership else None
    org_name = None

    if org_id:
        org = db.get(Organization, org_id)
        if org:
            org_name = org.name

    token = create_access_token(
        subject=user.id,
        extra_claims={
            "email": user.email,
            "org_id": str(org_id) if org_id else None,
            "role": role.value if role else None,
            "is_platform_admin": user.is_platform_admin,
        },
    )

    user_public = UserPublic(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=role,
        organization_id=org_id,
        organization_name=org_name,
        is_platform_admin=user.is_platform_admin,
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=user_public,
    )


@router.get("/me", response_model=UserPublic)
def get_current_user_profile(
    ctx: Context = Depends(require_member),
    db: Session = Depends(get_db),
):
    """
    Returns the authenticated user's current identity, active organization,
    and assigned RBAC role. Protected endpoint requiring valid JWT.
    """
    user = db.get(User, ctx.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    org_name = None
    if ctx.organization_id:
        org = db.get(Organization, ctx.organization_id)
        if org:
            org_name = org.name

    return UserPublic(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=ctx.role,
        organization_id=ctx.organization_id,
        organization_name=org_name,
        is_platform_admin=user.is_platform_admin,
    )
