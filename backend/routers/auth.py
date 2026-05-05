import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from passlib.context import CryptContext
from database import get_db

logger = logging.getLogger("datasales.auth")
from models.user import User
from schemas.auth import (
    LoginRequest, TokenResponse, UserPublic, MeResponse,
    CreateUserRequest, ChangePasswordRequest,
)
from dependencies.auth import create_access_token, get_current_user
from dependencies.permissions import require_admin

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    ip = request.client.host if request.client else "unknown"
    result = await db.execute(
        select(User).where(User.email == body.email, User.is_active == True)
    )
    user = result.scalar_one_or_none()

    if user is None or not pwd_context.verify(body.password, user.hashed_password):
        logger.warning("LOGIN_FAILED email=%s ip=%s", body.email, ip)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
        )

    logger.info("LOGIN_OK user=%s role=%s ip=%s", user.id, user.role, ip)
    token = create_access_token(user)
    return TokenResponse(access_token=token)


@router.get("/me", response_model=MeResponse)
async def me(current_user: User = Depends(get_current_user)):
    return MeResponse(user=UserPublic.model_validate(current_user))


# ── User Management (admin only) ──────────────────────────────────────────────


@router.get("/users", response_model=list[UserPublic])
async def list_users(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    require_admin(current_user)
    result = await db.execute(select(User).order_by(User.name))
    return result.scalars().all()


@router.post("/users", response_model=UserPublic, status_code=201)
async def create_user(
    body: CreateUserRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    require_admin(current_user)

    # Check if email already exists
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ya existe un usuario con el email {body.email}",
        )

    user = User(
        name=body.name,
        email=body.email,
        hashed_password=pwd_context.hash(body.password),
        role=body.role,
        avatar_color=body.avatar_color,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.patch("/users/{user_id}", response_model=UserPublic)
async def update_user(
    user_id: str,
    body: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    require_admin(current_user)
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    allowed_fields = {"name", "role", "avatar_color", "is_active"}
    for field, value in body.items():
        if field in allowed_fields:
            setattr(user, field, value)
        elif field == "password":
            user.hashed_password = pwd_context.hash(value)

    await db.commit()
    await db.refresh(user)
    return user


# ── Change own password ───────────────────────────────────────────────────────


@router.patch("/change-password")
async def change_password(
    body: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not pwd_context.verify(body.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña actual es incorrecta",
        )

    current_user.hashed_password = pwd_context.hash(body.new_password)
    await db.commit()
    return {"detail": "Contraseña actualizada correctamente"}

