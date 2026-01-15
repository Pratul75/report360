from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import date, datetime
from models import UserRole, CampaignStatus, CampaignType, PaymentStatus, ExpenseStatus

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None
    password: str
    role: UserRole

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    phone: Optional[str]
    role: UserRole
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class ClientCreate(BaseModel):
    name: str
    company: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    contact_person: Optional[str] = None

class ClientResponse(BaseModel):
    id: int
    name: str
    company: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    address: Optional[str]
    contact_person: Optional[str]
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    client_id: int
    budget: Optional[float] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    assigned_cs: Optional[str] = None

class ProjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    client_id: int
    budget: Optional[float]
    start_date: Optional[date]
    end_date: Optional[date]
    status: str
    assigned_cs: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class VendorCreate(BaseModel):
    name: str
    company: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    contact_person: Optional[str] = None

class VendorResponse(BaseModel):
    id: int
    name: str
    company: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    address: Optional[str]
    contact_person: Optional[str]
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class VehicleCreate(BaseModel):
    vehicle_number: str
    vehicle_type: Optional[str] = None
    capacity: Optional[str] = None
    vendor_id: Optional[int] = None
    rc_validity: Optional[date] = None
    insurance_validity: Optional[date] = None
    permit_validity: Optional[date] = None

class VehicleResponse(BaseModel):
    id: int
    vehicle_number: str
    vehicle_type: Optional[str]
    capacity: Optional[str]
    vendor_id: Optional[int]
    rc_validity: Optional[date]
    insurance_validity: Optional[date]
    permit_validity: Optional[date]
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class DriverCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    license_number: Optional[str] = None
    license_validity: Optional[date] = None
    vendor_id: Optional[int] = None

class DriverResponse(BaseModel):
    id: int
    name: str
    phone: Optional[str]
    email: Optional[str]
    license_number: Optional[str]
    license_validity: Optional[date]
    vendor_id: Optional[int]
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class PromoterCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    specialty: Optional[str] = None
    language: Optional[str] = None

class PromoterResponse(BaseModel):
    id: int
    name: str
    phone: Optional[str]
    email: Optional[str]
    specialty: Optional[str]
    language: Optional[str]
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class CampaignCreate(BaseModel):
    name: str
    description: Optional[str] = None
    project_id: int
    campaign_type: CampaignType
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: Optional[float] = None
    locations: Optional[str] = None

class CampaignResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    project_id: int
    campaign_type: CampaignType
    status: CampaignStatus
    start_date: Optional[date]
    end_date: Optional[date]
    budget: Optional[float]
    locations: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class ExpenseCreate(BaseModel):
    campaign_id: Optional[int] = None
    driver_id: Optional[int] = None
    expense_type: str
    amount: float
    description: Optional[str] = None
    bill_url: Optional[str] = None
    submitted_date: Optional[date] = None

class ExpenseResponse(BaseModel):
    id: int
    campaign_id: Optional[int]
    driver_id: Optional[int]
    expense_type: str
    amount: float
    description: Optional[str]
    bill_url: Optional[str]
    status: ExpenseStatus
    submitted_date: Optional[date]
    approved_date: Optional[date]
    created_at: datetime
    
    class Config:
        from_attributes = True

class ReportCreate(BaseModel):
    campaign_id: int
    report_date: date
    locations_covered: Optional[str] = None
    km_travelled: Optional[float] = None
    photos_url: Optional[str] = None
    gps_data: Optional[str] = None
    notes: Optional[str] = None

class ReportResponse(BaseModel):
    id: int
    campaign_id: int
    report_date: date
    locations_covered: Optional[str]
    km_travelled: Optional[float]
    photos_url: Optional[str]
    gps_data: Optional[str]
    notes: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    active_projects: int
    running_campaigns: int
    vehicles_on_ground: int
    todays_expense: float
    pending_expenses: int
    pending_payments: int
