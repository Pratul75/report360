from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional
from datetime import date, datetime

class PromoterActivityBase(BaseModel):
    """Base schema for promoter activity"""
    promoter_id: int = Field(..., description="ID of the promoter")
    promoter_name: str = Field(..., min_length=1, max_length=255, description="Name of the promoter")
    campaign_id: int = Field(..., description="ID of the campaign")
    village_name: str = Field(..., min_length=1, max_length=255, description="Village/Location name")
    activity_date: date = Field(..., description="Date of the activity")
    people_attended: int = Field(default=0, ge=0, description="Number of people attended (non-negative)")
    activity_count: int = Field(default=0, ge=0, description="Number of activities conducted (non-negative)")
    specialty: Optional[str] = Field(None, max_length=255, description="Promoter specialty")
    language: Optional[str] = Field(None, max_length=100, description="Language(s) spoken")
    remarks: Optional[str] = Field(None, description="Additional notes or remarks")

class PromoterActivityCreate(PromoterActivityBase):
    """Schema for creating promoter activity"""
    # Image URLs will be added after upload via separate endpoint
    pass

class PromoterActivityUpdate(BaseModel):
    """Schema for updating promoter activity"""
    promoter_name: Optional[str] = Field(None, min_length=1, max_length=255)
    village_name: Optional[str] = Field(None, min_length=1, max_length=255)
    activity_date: Optional[date] = None
    people_attended: Optional[int] = Field(None, ge=0)
    activity_count: Optional[int] = Field(None, ge=0)
    specialty: Optional[str] = Field(None, max_length=255)
    language: Optional[str] = Field(None, max_length=100)
    remarks: Optional[str] = None
    
    model_config = ConfigDict(extra='forbid')

class PromoterActivityImageUpdate(BaseModel):
    """Schema for updating activity images"""
    before_image: Optional[str] = None
    during_image: Optional[str] = None
    after_image: Optional[str] = None

class PromoterActivityResponse(PromoterActivityBase):
    """Schema for promoter activity response"""
    id: int
    before_image: Optional[str] = None
    during_image: Optional[str] = None
    after_image: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    created_by_id: Optional[int] = None
    is_active: bool
    
    # Related data (optional, for detail view)
    campaign_name: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

class PromoterActivityFilter(BaseModel):
    """Schema for filtering activities"""
    campaign_id: Optional[int] = None
    promoter_id: Optional[int] = None
    village_name: Optional[str] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    language: Optional[str] = None
    
class PromoterActivityStats(BaseModel):
    """Statistics for promoter activities"""
    total_activities: int
    total_people_reached: int
    total_villages: int
    active_promoters: int
    avg_attendance_per_activity: float
