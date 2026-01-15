from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class PromoterBase(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    specialty: Optional[str] = None
    language: Optional[str] = None

class PromoterCreate(PromoterBase):
    pass

class PromoterUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    specialty: Optional[str] = None
    language: Optional[str] = None

class PromoterResponse(PromoterBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
