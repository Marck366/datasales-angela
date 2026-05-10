from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from database import get_db
from models.contact import Contact
from models.user import User
from schemas.contact import ContactCreate, ContactUpdate, ContactOut
from dependencies.auth import get_current_user
from dependencies.permissions import is_elevated, can_access_contact, require_elevated

router = APIRouter()


@router.get("/", response_model=list[ContactOut])
async def list_contacts(
    company_id: Optional[str] = None,
    assigned_to: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Contact).options(
        selectinload(Contact.company),
        selectinload(Contact.assignee),
    )
    if not is_elevated(current_user):
        query = query.where(Contact.assigned_to == current_user.id)
    elif assigned_to:
        query = query.where(Contact.assigned_to == assigned_to)
    if company_id:
        query = query.where(Contact.company_id == company_id)

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{contact_id}", response_model=ContactOut)
async def get_contact(
    contact_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Contact)
        .options(selectinload(Contact.company), selectinload(Contact.assignee))
        .where(Contact.id == contact_id)
    )
    contact = result.scalar_one_or_none()
    if contact is None:
        raise HTTPException(status_code=404, detail="Contacto no encontrado")
    if not can_access_contact(current_user, contact.assigned_to):
        raise HTTPException(status_code=403, detail="Sin acceso a este contacto")
    return contact


@router.post("/", response_model=ContactOut, status_code=201)
async def create_contact(
    body: ContactCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import update
    
    contact = Contact(**body.model_dump())
    if not contact.assigned_to:
        contact.assigned_to = current_user.id
    db.add(contact)
    await db.commit()
    
    if contact.is_primary and contact.company_id:
        await db.execute(
            update(Contact)
            .where(Contact.company_id == contact.company_id)
            .where(Contact.id != contact.id)
            .values(is_primary=False)
        )
        await db.commit()
    
    # Reload with relationships to avoid MissingGreenlet on serialization
    result = await db.execute(
        select(Contact)
        .options(selectinload(Contact.company), selectinload(Contact.assignee))
        .where(Contact.id == contact.id)
    )
    return result.scalar_one()


@router.patch("/{contact_id}", response_model=ContactOut)
async def update_contact(
    contact_id: str,
    body: ContactUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import update as sa_update

    result = await db.execute(select(Contact).where(Contact.id == contact_id))
    contact = result.scalar_one_or_none()
    if contact is None:
        raise HTTPException(status_code=404, detail="Contacto no encontrado")
    if not can_access_contact(current_user, contact.assigned_to):
        raise HTTPException(status_code=403, detail="Sin acceso a este contacto")

    update_data = body.model_dump(exclude_unset=True)
    setting_primary = update_data.get("is_primary") is True and contact.company_id

    # Si se marca como principal, primero quitar la estrella a todos los demás de la empresa
    if setting_primary:
        await db.execute(
            sa_update(Contact)
            .where(Contact.company_id == contact.company_id)
            .where(Contact.id != contact_id)
            .values(is_primary=False)
        )

    # Si cambia el status, registrar el timestamp del cambio
    if "status" in update_data and update_data["status"] != contact.status:
        from datetime import datetime, timezone
        contact.status_changed_at = datetime.now(timezone.utc)

    for field, value in update_data.items():
        setattr(contact, field, value)

    await db.commit()

    # Reload with relationships to avoid MissingGreenlet on serialization
    updated_result = await db.execute(
        select(Contact)
        .options(selectinload(Contact.company), selectinload(Contact.assignee))
        .where(Contact.id == contact_id)
    )
    return updated_result.scalar_one()


@router.delete("/{contact_id}", status_code=204)
async def delete_contact(
    contact_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    require_elevated(current_user)
    result = await db.execute(select(Contact).where(Contact.id == contact_id))
    contact = result.scalar_one_or_none()
    if contact is None:
        raise HTTPException(status_code=404, detail="Contacto no encontrado")
    await db.delete(contact)
    await db.commit()
