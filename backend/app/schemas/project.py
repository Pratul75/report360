from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import date, datetime

# -----------------------------
# BASE PROJECT SCHEMAS
# -----------------------------

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    client_id: int
    budget: Optional[float] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    assigned_cs: Optional[int] = None


# -----------------------------
# DYNAMIC PROJECT FIELD SCHEMAS
# -----------------------------

class ProjectFieldCreate(BaseModel):
    field_name: str
    field_type: str   # text | number | date | dropdown
    required: bool = False
    options: Optional[List[str]] = []


class ProjectFieldResponse(ProjectFieldCreate):
    id: int

    @field_validator('options', mode='before')
    @classmethod
    def parse_options(cls, v):
        if isinstance(v, str):
            import json
            try:
                return json.loads(v)
            except:
                return []
        return v

    class Config:
        from_attributes = True


# -----------------------------
# CREATE / UPDATE
# -----------------------------

class ProjectCreate(ProjectBase):
    fields: Optional[List[ProjectFieldCreate]] = []   # 


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    client_id: Optional[int] = None
    budget: Optional[float] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None
    assigned_cs: Optional[int] = None
    fields: Optional[List[ProjectFieldCreate]] = None   # 


# -----------------------------
# NESTED RESPONSE SCHEMAS
# -----------------------------

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


class UserBrief(BaseModel):
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True


# -----------------------------
# PROJECT RESPONSE
# -----------------------------

class ProjectResponse(ProjectBase):
    id: int
    status: str
    created_at: datetime

    client: Optional[ClientBrief] = None
    cs_user: Optional[UserBrief] = None
    campaigns: List[CampaignBrief] = []

    fields: List[ProjectFieldResponse] = []   # 👈 ADDED

    class Config:
        from_attributes = True
