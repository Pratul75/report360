from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date, datetime

class DriverBase(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    license_number: Optional[str] = None
    license_validity: Optional[date] = None
    license_image: Optional[str] = None
    vendor_id: Optional[int] = None
    vehicle_id: Optional[int] = None  # Assigned vehicle

class DriverCreate(DriverBase):
    pass

class DriverUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    license_number: Optional[str] = None
    license_validity: Optional[date] = None
    license_image: Optional[str] = None
    vendor_id: Optional[int] = None
    vehicle_id: Optional[int] = None  # Assigned vehicle

class DriverResponse(DriverBase):
    id: int
    is_active: bool
    created_at: datetime
    vehicle_number: Optional[str] = None  # Vehicle number for display
    license_image: Optional[str] = None
    vendor_name: Optional[str] = None  # Vendor name for display
    
    class Config:
        from_attributes = True
