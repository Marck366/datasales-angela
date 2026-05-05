from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from database import get_db
from models.contact import Contact
from models.user import User
from dependencies.auth import get_current_user
from dependencies.permissions import is_elevated

router = APIRouter()


@router.get("/stats")
async def get_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Contact)
    if not is_elevated(current_user):
        query = query.where(Contact.assigned_to == current_user.id)

    result = await db.execute(query)
    contacts = result.scalars().all()

    total = len(contacts)
    by_status: dict[str, int] = {}
    pipeline_value = 0.0

    for c in contacts:
        by_status[c.status] = by_status.get(c.status, 0) + 1
        if c.valor_potencial and c.probabilidad_cierre:
            pipeline_value += c.valor_potencial * (c.probabilidad_cierre / 100)

    return {
        "total_contacts": total,
        "by_status": by_status,
        "pipeline_value": round(pipeline_value, 2),
    }


@router.get("/ranking")
async def get_ranking(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(
            User.id,
            User.name,
            User.avatar_color,
            func.count(Contact.id).label("total_contacts"),
        )
        .join(Contact, Contact.assigned_to == User.id, isouter=True)
        .where(User.is_active == True)
        .group_by(User.id)
        .order_by(func.count(Contact.id).desc())
    )
    rows = result.all()
    return [
        {
            "user_id": r.id,
            "name": r.name,
            "avatar_color": r.avatar_color,
            "total_contacts": r.total_contacts,
        }
        for r in rows
    ]
