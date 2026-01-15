from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    client_id: int
    budget: Optional[float] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    assigned_cs: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    budget: Optional[float] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None
    assigned_cs: Optional[str] = None

# Nested schemas for relationships
class CampaignBrief(BaseModel):
    id: int
    name: str
    status: Optional[str] = None
    
    class Config:
        from_attributes = True

class ClientBrief(BaseModel):
    id: int
    name: str
    
    class Config:
        from_attributes = True

class ProjectResponse(ProjectBase):
    id: int
    status: str
    created_at: datetime
    client: Optional[ClientBrief] = None
    campaigns: List[CampaignBrief] = []
    
    class Config:
        from_attributes = True
