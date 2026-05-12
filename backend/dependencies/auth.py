from __future__ import annotations

from fastapi import Depends, HTTPException, Request, status
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from config import get_settings
from database import get_db
from models.user import User

settings = get_settings()

SESSION_COOKIE_NAME = "datasales_session"


def create_access_token(user: User) -> str:
    from datetime import datetime, timedelta, timezone
    expire = datetime.now(timezone.utc) + timedelta(hours=settings.jwt_expire_hours)
    payload = {
        "sub": user.id,
        "role": user.role,
        "exp": expire,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def _extract_token(request: Request) -> str | None:
    cookie_token = request.cookies.get(SESSION_COOKIE_NAME)
    if cookie_token:
        return cookie_token
    auth_header = request.headers.get("authorization") or request.headers.get("Authorization")
    if auth_header and auth_header.lower().startswith("bearer "):
        return auth_header.split(" ", 1)[1].strip()
    return None


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido o expirado",
    )
    token = _extract_token(request)
    if not token:
        raise credentials_exception
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == user_id, User.is_active == True))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    return user
