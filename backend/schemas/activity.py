from __future__ import annotations

from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field


class CreatorNested(BaseModel):
    id: str
    name: str
    avatar_color: Optional[str] = None

    model_config = {"from_attributes": True}


class ActivityCreate(BaseModel):
    contact_id: str
    type: Literal["nota", "llamada", "email", "whatsapp", "reunion", "estado"]
    content: Optional[str] = Field(None, max_length=5000)
    old_value: Optional[str] = Field(None, max_length=255)
    new_value: Optional[str] = Field(None, max_length=255)


class ActivityOut(BaseModel):
    id: str
    contact_id: str
    created_by: str
    type: str
    content: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    created_at: Optional[datetime] = None
    creator: Optional[CreatorNested] = None

    model_config = {"from_attributes": True}

