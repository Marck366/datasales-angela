from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from database import get_db
from models.activity import Activity
from models.contact import Contact
from models.user import User
from schemas.activity import ActivityCreate, ActivityOut
from dependencies.auth import get_current_user
from dependencies.permissions import is_elevated, can_access_contact

router = APIRouter()


@router.get("/", response_model=list[ActivityOut])
async def list_activities(
    contact_id: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(200, ge=1, le=1000),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Activity).options(selectinload(Activity.creator))
    if contact_id:
        # Verify access to the contact first
        r = await db.execute(select(Contact).where(Contact.id == contact_id))
        contact = r.scalar_one_or_none()
        if contact is None:
            raise HTTPException(status_code=404, detail="Contacto no encontrado")
        if not can_access_contact(current_user, contact.assigned_to):
            raise HTTPException(status_code=403, detail="Sin acceso a este contacto")
        query = query.where(Activity.contact_id == contact_id)
    elif not is_elevated(current_user):
        # Only return activities for contacts assigned to this user
        subq = select(Contact.id).where(Contact.assigned_to == current_user.id)
        query = query.where(Activity.contact_id.in_(subq))

    query = query.order_by(Activity.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=ActivityOut, status_code=201)
async def create_activity(
    body: ActivityCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    r = await db.execute(select(Contact).where(Contact.id == body.contact_id))
    contact = r.scalar_one_or_none()
    if contact is None:
        raise HTTPException(status_code=404, detail="Contacto no encontrado")
    if not can_access_contact(current_user, contact.assigned_to):
        raise HTTPException(status_code=403, detail="Sin acceso a este contacto")

    activity = Activity(**body.model_dump(), created_by=current_user.id)
    db.add(activity)

    # Update last_activity_at for real interactions (not status changes)
    if body.type in ("llamada", "email", "whatsapp", "reunion", "nota"):
        from datetime import datetime, timezone
        contact.last_activity_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(activity)

    # Reload with creator relationship to avoid MissingGreenlet on serialization
    reloaded = await db.execute(
        select(Activity)
        .options(selectinload(Activity.creator))
        .where(Activity.id == activity.id)
    )
    return reloaded.scalar_one()


@router.delete("/{activity_id}", status_code=204)
async def delete_activity(
    activity_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Activity).where(Activity.id == activity_id))
    activity = result.scalar_one_or_none()
    if activity is None:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")

    if not is_elevated(current_user) and activity.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="No puedes eliminar esta actividad")

    await db.delete(activity)
    await db.commit()
