from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional


class CompanyCreate(BaseModel):
    name: str = Field(..., max_length=255)
    sector: Optional[str] = Field(None, max_length=100)


class CompanyUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    sector: Optional[str] = Field(None, max_length=100)


class CompanyOut(BaseModel):
    id: str
    name: str
    sector: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
