import re
import uuid
from pydantic import BaseModel, Field, field_validator

from app.models.enums import Role

EMAIL_REGEX = re.compile(r"^[\w\.-]+@[\w\.-]+\.\w+$")


class SignUpRequest(BaseModel):
    email: str = Field(description="User corporate email address")
    password: str = Field(min_length=8, description="Minimum 8 characters password")
    full_name: str | None = Field(default=None, max_length=255)
    organization_name: str | None = Field(default=None, max_length=255, description="Initial organization to create")
    role: Role | None = Field(default=Role.OWNER_ADMIN, description="Role within the organization")

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        clean = v.strip().lower()
        if not EMAIL_REGEX.match(clean):
            raise ValueError("Invalid email address format")
        return clean


class LoginRequest(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        clean = v.strip().lower()
        if not EMAIL_REGEX.match(clean):
            raise ValueError("Invalid email address format")
        return clean


class UserPublic(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str | None = None
    role: Role | None = None
    organization_id: uuid.UUID | None = None
    organization_name: str | None = None
    is_platform_admin: bool = False


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic
