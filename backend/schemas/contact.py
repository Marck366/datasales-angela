from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field


class CompanyNested(BaseModel):
    id: str
    name: str
    sector: Optional[str] = None
    model_config = {"from_attributes": True}


class UserNested(BaseModel):
    id: str
    name: str
    avatar_color: Optional[str] = None
    role: Optional[str] = None
    model_config = {"from_attributes": True}


_STATUS = Literal[
    "nuevo", "agendado", "pendiente_propuesta", "propuesta_mandada",
    "aplazado", "perdido", "cerrado", "propuesta_solicitada",
    "propuesta_entregada", "aceptada", "prevision_cierre", "rechazada"
]
_PIPELINE = Literal["captura", "cartera"]
_PRIORIDAD = Literal["alta", "media", "baja"]


class ContactBase(BaseModel):
    first_name: str = Field(..., max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    linkedin_url: Optional[str] = Field(None, max_length=500)
    job_title: Optional[str] = Field(None, max_length=100)
    company_id: Optional[str] = None
    assigned_to: Optional[str] = None
    status: _STATUS = "nuevo"
    pipeline: Optional[_PIPELINE] = "captura"
    prioridad: Optional[_PRIORIDAD] = None
    tipo: Optional[str] = Field(None, max_length=50)
    scheduled_date: Optional[str] = None
    seguimiento_date: Optional[str] = None
    semana: Optional[str] = Field(None, max_length=50)
    semana_date: Optional[str] = None
    valor_potencial: Optional[float] = Field(None, ge=0)
    probabilidad_cierre: Optional[int] = Field(None, ge=0, le=100)
    fecha_cierre_probable: Optional[str] = None
    meeting_type: Optional[str] = Field(None, max_length=50)
    lost_reason: Optional[str] = Field(None, max_length=500)
    next_step: Optional[str] = Field(None, max_length=1000)
    score_ai: Optional[int] = Field(None, ge=0, le=100)
    servicio_interes: Optional[str] = Field(None, max_length=255)
    estado_certificacion: Optional[str] = Field(None, max_length=255)
    empleados_empresa: Optional[str] = Field(None, max_length=50)
    decision_maker: Optional[bool] = None
    is_primary: bool = True


class ContactCreate(ContactBase):
    pass


class ContactUpdate(BaseModel):
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    linkedin_url: Optional[str] = Field(None, max_length=500)
    job_title: Optional[str] = Field(None, max_length=100)
    company_id: Optional[str] = None
    assigned_to: Optional[str] = None
    status: Optional[_STATUS] = None
    pipeline: Optional[_PIPELINE] = None
    prioridad: Optional[_PRIORIDAD] = None
    tipo: Optional[str] = Field(None, max_length=50)
    scheduled_date: Optional[str] = None
    seguimiento_date: Optional[str] = None
    semana: Optional[str] = Field(None, max_length=50)
    semana_date: Optional[str] = None
    valor_potencial: Optional[float] = Field(None, ge=0)
    probabilidad_cierre: Optional[int] = Field(None, ge=0, le=100)
    fecha_cierre_probable: Optional[str] = None
    meeting_type: Optional[str] = Field(None, max_length=50)
    lost_reason: Optional[str] = Field(None, max_length=500)
    next_step: Optional[str] = Field(None, max_length=1000)
    score_ai: Optional[int] = Field(None, ge=0, le=100)
    servicio_interes: Optional[str] = Field(None, max_length=255)
    estado_certificacion: Optional[str] = Field(None, max_length=255)
    empleados_empresa: Optional[str] = Field(None, max_length=50)
    decision_maker: Optional[bool] = None
    is_primary: Optional[bool] = None


class ContactOut(ContactBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    status_changed_at: Optional[datetime] = None
    last_activity_at: Optional[datetime] = None
    company: Optional[CompanyNested] = None
    assignee: Optional[UserNested] = None
    model_config = {"from_attributes": True}
