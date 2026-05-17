import hashlib
import logging
import secrets
import time
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from passlib.context import CryptContext
from database import get_db
from config import get_settings

logger = logging.getLogger("datasales.auth")
settings = get_settings()
from models.user import User
from schemas.auth import (
    LoginRequest, LoginResponse, UserPublic, MeResponse,
    CreateUserRequest, ChangePasswordRequest, UpdateUserRequest,
)
from dependencies.auth import create_access_token, get_current_user, SESSION_COOKIE_NAME
from dependencies.permissions import require_admin

CSRF_COOKIE_NAME = "datasales_csrf"

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Rate limiting en memoria: 5 intentos en ventana de 3 min
_LOGIN_WINDOW_SECONDS = 180
_LOGIN_MAX_ATTEMPTS = 5
_failed_attempts: dict[str, list[float]] = defaultdict(list)


def _rate_limit_check(key: str) -> None:
    now = time.time()
    window = [t for t in _failed_attempts[key] if now - t < _LOGIN_WINDOW_SECONDS]
    _failed_attempts[key] = window
    if len(window) >= _LOGIN_MAX_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Demasiados intentos fallidos. Espera 3 minutos antes de volver a intentarlo.",
        )


def _record_failed_attempt(key: str) -> None:
    _failed_attempts[key].append(time.time())


def _reset_attempts(key: str) -> None:
    _failed_attempts.pop(key, None)


def _hash_log_value(value: str) -> str:
    return hashlib.sha256(f"{settings.effective_log_hash_salt}:{value}".encode()).hexdigest()[:12]


def _set_session_cookies(response: Response, token: str) -> str:
    csrf_token = secrets.token_urlsafe(32)
    max_age = settings.jwt_expire_hours * 3600
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        max_age=max_age,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        path="/",
    )
    return csrf_token


def _clear_session_cookies(response: Response) -> None:
    response.delete_cookie(SESSION_COOKIE_NAME, path="/")


@router.post("/login", response_model=LoginResponse)
async def login(
    body: LoginRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    ip = request.client.host if request.client else "unknown"
    email_key = f"email:{body.email.lower()}"
    ip_key = f"ip:{ip}"
    email_hash = hashlib.sha256(body.email.lower().encode()).hexdigest()[:12]
    ip_hash = _hash_log_value(ip)

    _rate_limit_check(email_key)
    _rate_limit_check(ip_key)

    result = await db.execute(
        select(User).where(User.email == body.email, User.is_active == True)
    )
    user = result.scalar_one_or_none()

    if user is None or not pwd_context.verify(body.password, user.hashed_password):
        _record_failed_attempt(email_key)
        _record_failed_attempt(ip_key)
        logger.warning("LOGIN_FAILED email_hash=%s ip_hash=%s", email_hash, ip_hash)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
        )

    _reset_attempts(email_key)
    _reset_attempts(ip_key)
    logger.info("LOGIN_OK user_hash=%s role=%s ip_hash=%s", _hash_log_value(user.id), user.role, ip_hash)
    token = create_access_token(user)
    csrf_token = _set_session_cookies(response, token)
    return LoginResponse(ok=True, csrf_token=csrf_token)


@router.post("/logout")
async def logout(response: Response):
    _clear_session_cookies(response)
    return {"ok": True}


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
            detail="Ya existe un usuario con ese email",
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
    body: UpdateUserRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    require_admin(current_user)
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    update_data = body.model_dump(exclude_unset=True)
    password = update_data.pop("password", None)

    for field, value in update_data.items():
        setattr(user, field, value)

    if password is not None:
        user.hashed_password = pwd_context.hash(password)

    await db.commit()
    await db.refresh(user)

    changed_fields = list(update_data.keys()) + (["password"] if password else [])
    logger.info(
        "USER_UPDATED by_hash=%s target_hash=%s fields=%s",
        _hash_log_value(current_user.id), _hash_log_value(user.id), ",".join(changed_fields) or "none",
    )
    return user


# ── Change own password ───────────────────────────────────────────────────────


@router.patch("/change-password")
async def change_password(
    body: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not pwd_context.verify(body.current_password, current_user.hashed_password):
        logger.warning("PASSWORD_CHANGE_FAILED user_hash=%s reason=wrong_current", _hash_log_value(current_user.id))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña actual es incorrecta",
        )

    current_user.hashed_password = pwd_context.hash(body.new_password)
    await db.commit()
    logger.info("PASSWORD_CHANGED user_hash=%s", _hash_log_value(current_user.id))
    return {"detail": "Contraseña actualizada correctamente"}
