from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
import anthropic
from database import get_db
from models.contact import Contact
from models.user import User
from config import get_settings
from dependencies.auth import get_current_user
from dependencies.permissions import can_access_contact

router = APIRouter()
settings = get_settings()


class PrepararReuionRequest(BaseModel):
    contact_id: str
    recent_activities: Optional[list[dict]] = []


@router.post("/preparar-reunion")
async def preparar_reunion(
    body: PrepararReuionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Contact).where(Contact.id == body.contact_id))
    contact = result.scalar_one_or_none()
    if contact is None:
        raise HTTPException(status_code=404, detail="Contacto no encontrado")
    if not can_access_contact(current_user, contact.assigned_to):
        raise HTTPException(status_code=403, detail="Sin acceso a este contacto")

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    activities_text = ""
    if body.recent_activities:
        activities_text = "\n".join(
            f"- [{a.get('type', '')}] {a.get('content', '')}" for a in body.recent_activities[-5:]
        )

    prompt = f"""Eres un asistente de ventas ESG. Prepara un briefing conciso para una reunión con este contacto.

Contacto: {contact.first_name} {contact.last_name or ''}
Cargo: {contact.job_title or 'N/A'}
Estado: {contact.status}
Servicio de interés: {contact.servicio_interes or 'N/A'}
Siguiente paso: {contact.next_step or 'N/A'}

Actividad reciente:
{activities_text or 'Sin actividad registrada'}

Responde en español con:
1. Contexto rápido (2 frases)
2. Objetivo de la llamada
3. 2-3 preguntas clave"""

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=500,
        messages=[{"role": "user", "content": prompt}],
    )

    return {"briefing": message.content[0].text}
