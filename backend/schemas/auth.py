from __future__ import annotations

from typing import Literal, Optional
from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=100)


class TokenResponse(BaseModel):
    """Legacy — mantenido por compat. El nuevo flujo usa cookie httpOnly."""
    access_token: str
    token_type: str = "bearer"


class LoginResponse(BaseModel):
    ok: bool = True
    csrf_token: str


class UserPublic(BaseModel):
    id: str
    name: str
    email: str
    role: str
    avatar_color: str | None = None
    is_active: bool

    model_config = {"from_attributes": True}


class MeResponse(BaseModel):
    user: UserPublic


class CreateUserRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=100)
    role: Literal["admin", "jefe_ventas", "comercial"] = "comercial"
    avatar_color: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=100)


class UpdateUserRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    role: Optional[Literal["admin", "jefe_ventas", "comercial"]] = None
    avatar_color: Optional[str] = Field(None, max_length=50)
    is_active: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=8, max_length=100)

