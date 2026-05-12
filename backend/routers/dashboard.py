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
    base_filter = []
    if not is_elevated(current_user):
        base_filter.append(Contact.assigned_to == current_user.id)

    total_query = select(
        func.count(Contact.id),
        func.coalesce(func.sum(Contact.valor_potencial * Contact.probabilidad_cierre / 100), 0.0),
    ).where(*base_filter)
    total, pipeline_value = (await db.execute(total_query)).one()

    status_query = (
        select(Contact.status, func.count(Contact.id))
        .where(*base_filter)
        .group_by(Contact.status)
    )
    by_status = {status: count for status, count in (await db.execute(status_query)).all()}

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
            User.role,
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
            "role": r.role,
            "avatar_color": r.avatar_color,
            "total_contacts": r.total_contacts,
        }
        for r in rows
    ]
