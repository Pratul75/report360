from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from enum import Enum

class CampaignType(str, Enum):
    L_SHAPE = "l_shape"
    BTL = "btl"
    ROADSHOW = "roadshow"
    SAMPLING = "sampling"
    OTHER = "other"

class CampaignStatus(str, Enum):
    PLANNING = "planning"
    UPCOMING = "upcoming"
    RUNNING = "running"
    HOLD = "hold"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class CampaignBase(BaseModel):
    name: str
    description: Optional[str] = None
    project_id: int
    campaign_type: CampaignType
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: Optional[float] = None
    locations: Optional[str] = None

class CampaignCreate(CampaignBase):
    vendor_ids: Optional[List[int]] = []  # Vendors to assign to this campaign

class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    campaign_type: Optional[CampaignType] = None
    status: Optional[CampaignStatus] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: Optional[float] = None
    locations: Optional[str] = None
    vendor_ids: Optional[List[int]] = []  # Vendors to assign/reassign

class CampaignResponse(CampaignBase):
    id: int
    status: CampaignStatus
    created_at: datetime
    project_name: Optional[str] = None
    client_name: Optional[str] = None
    vendor_names: Optional[List[str]] = []
    vendor_ids: Optional[List[int]] = []
    
    class Config:
        from_attributes = True

class CampaignAssignment(BaseModel):
    campaign_id: int
    vehicle_ids: Optional[list[str]] = []
    driver_ids: Optional[list[str]] = []
    promoter_ids: Optional[list[str]] = []
