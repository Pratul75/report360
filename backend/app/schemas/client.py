from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class ProjectBrief(BaseModel):
    id: int
    name: str
    status: Optional[str] = None
    
    class Config:
        from_attributes = True

class ClientBase(BaseModel):
    name: str
    company: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    contact_person: Optional[str] = None

class ClientCreate(ClientBase):
    pass

class ClientUpdate(BaseModel):
    name: Optional[str] = None
    company: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    contact_person: Optional[str] = None

class ClientResponse(ClientBase):
    id: int
    is_active: bool
    created_at: datetime
    projects: List[ProjectBrief] = []
    
    class Config:
        from_attributes = True
