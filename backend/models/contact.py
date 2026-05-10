from __future__ import annotations

from typing import Optional
import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Boolean, Float, Integer, ForeignKey, func, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class Contact(Base):
    __tablename__ = "contacts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("companies.id"), nullable=True)
    assigned_to: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)

    first_name: Mapped[str] = mapped_column(String(255), nullable=False)
    last_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    linkedin_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    job_title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    status: Mapped[str] = mapped_column(String(100), nullable=False, default="nuevo")
    pipeline: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, default="captura")
    prioridad: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    tipo: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    scheduled_date: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    seguimiento_date: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    semana: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    semana_date: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    valor_potencial: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    probabilidad_cierre: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    fecha_cierre_probable: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    meeting_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    lost_reason: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    next_step: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    score_ai: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # ESG fields
    servicio_interes: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    estado_certificacion: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    empleados_empresa: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    decision_maker: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)

    is_primary: Mapped[bool] = mapped_column(Boolean, default=True)

    status_changed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    last_activity_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    company: Mapped[Optional["Company"]] = relationship("Company", back_populates="contacts")
    assignee: Mapped[Optional["User"]] = relationship("User", back_populates="assigned_contacts", foreign_keys=[assigned_to])
    activities: Mapped[list["Activity"]] = relationship("Activity", back_populates="contact")
