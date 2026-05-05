from __future__ import annotations

from fastapi import HTTPException, status
from models.user import User

ELEVATED_ROLES = {"admin", "jefe_ventas"}


def require_elevated(current_user: User) -> None:
    """Raises 403 if user is not admin or jefe_ventas."""
    if current_user.role not in ELEVATED_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para realizar esta acción",
        )


def require_admin(current_user: User) -> None:
    """Raises 403 if user is not admin."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los administradores pueden realizar esta acción",
        )


def is_elevated(user: User) -> bool:
    return user.role in ELEVATED_ROLES


def can_access_contact(user: User, contact_assigned_to: str | None) -> bool:
    """Returns True if user can read/modify this contact."""
    if is_elevated(user):
        return True
    return contact_assigned_to == user.id
