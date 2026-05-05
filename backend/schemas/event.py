from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional


class EventCreate(BaseModel):
    name: str = Field(..., max_length=255)
    date: Optional[str] = Field(None, max_length=50)
    city: Optional[str] = Field(None, max_length=100)
    type: Optional[str] = Field(None, max_length=100)
    sector: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=2000)
    website: Optional[str] = Field(None, max_length=500)
    attending: bool = False
    notes: Optional[str] = Field(None, max_length=2000)
    price_per_attendee: Optional[float] = None


class EventUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    date: Optional[str] = Field(None, max_length=50)
    city: Optional[str] = Field(None, max_length=100)
    type: Optional[str] = Field(None, max_length=100)
    sector: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=2000)
    website: Optional[str] = Field(None, max_length=500)
    attending: Optional[bool] = None
    notes: Optional[str] = Field(None, max_length=2000)
    price_per_attendee: Optional[float] = None


class EventOut(EventCreate):
    id: str
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
