from pydantic import BaseModel, computed_field
from typing import Optional
from datetime import date, datetime
from app.schemas.vendor import VendorResponse

class VehicleBase(BaseModel):
    vehicle_number: str
    vehicle_type: Optional[str] = None
    capacity: Optional[str] = None
    vendor_id: Optional[int] = None
    rc_validity: Optional[date] = None
    insurance_validity: Optional[date] = None
    permit_validity: Optional[date] = None
    rc_image: Optional[str] = None
    insurance_image: Optional[str] = None

class VehicleCreate(VehicleBase):
    pass

class VehicleUpdate(BaseModel):
    vehicle_type: Optional[str] = None
    capacity: Optional[str] = None
    vendor_id: Optional[int] = None
    rc_validity: Optional[date] = None
    insurance_validity: Optional[date] = None
    permit_validity: Optional[date] = None
    rc_image: Optional[str] = None
    insurance_image: Optional[str] = None

class VehicleResponse(VehicleBase):
    id: int
    is_active: bool
    created_at: datetime
    vendor: Optional[VendorResponse] = None
    
    class Config:
        from_attributes = True
