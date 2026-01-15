"""Pydantic schemas for Vendor Driver Booking & Work Assignment"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, time, datetime
from app.models.driver_assignment import AssignmentStatus, ApprovalStatus


class WorkAssignmentCreate(BaseModel):
    """Schema for creating a new work assignment"""
    campaign_id: int = Field(..., description="Campaign ID")
    driver_id: int = Field(..., description="Driver ID from vendor's pool")
    vehicle_id: int = Field(..., description="Vehicle ID from vendor's pool")
    assignment_date: date = Field(..., description="Date of assignment")
    
    work_title: str = Field(..., max_length=255, description="Type of work: Sampling, Promotion, Transport, etc.")
    work_description: Optional[str] = Field(None, description="Detailed work description")
    village_name: Optional[str] = Field(None, max_length=255, description="Village or location name")
    location_address: Optional[str] = Field(None, description="Full address")
    
    expected_start_time: Optional[time] = Field(None, description="Expected start time")
    expected_end_time: Optional[time] = Field(None, description="Expected end time")
    
    remarks: Optional[str] = Field(None, description="Additional remarks")
    
    class Config:
        json_schema_extra = {
            "example": {
                "campaign_id": 1,
                "driver_id": 3,
                "vehicle_id": 1,
                "assignment_date": "2026-01-10",
                "work_title": "Product Sampling",
                "work_description": "Distribute product samples at village market",
                "village_name": "Rampur",
                "location_address": "Main Market, Near Bus Stand, Rampur",
                "expected_start_time": "09:00:00",
                "expected_end_time": "17:00:00",
                "remarks": "Bring ice boxes for samples"
            }
        }


class WorkAssignmentUpdate(BaseModel):
    """Schema for updating work assignment"""
    work_title: Optional[str] = Field(None, max_length=255)
    work_description: Optional[str] = None
    village_name: Optional[str] = Field(None, max_length=255)
    location_address: Optional[str] = None
    expected_start_time: Optional[time] = None
    expected_end_time: Optional[time] = None
    status: Optional[AssignmentStatus] = None
    remarks: Optional[str] = None


class WorkAssignmentResponse(BaseModel):
    """Schema for work assignment response"""
    id: int
    campaign_id: Optional[int]
    campaign_name: Optional[str]
    driver_id: int
    driver_name: str
    vehicle_id: Optional[int]
    vehicle_number: Optional[str]
    assignment_date: date
    
    work_title: Optional[str]
    work_description: Optional[str]
    village_name: Optional[str]
    location_address: Optional[str]
    
    expected_start_time: Optional[time]
    expected_end_time: Optional[time]
    actual_start_time: Optional[datetime]
    actual_end_time: Optional[datetime]
    
    status: str
    assigned_by_id: Optional[int]
    assigned_by_name: Optional[str]
    completed_at: Optional[datetime]
    remarks: Optional[str]
    
    # Driver approval fields
    approval_status: str
    approved_at: Optional[datetime]
    rejected_at: Optional[datetime]
    rejection_reason: Optional[str]
    
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class DriverApprovalAction(BaseModel):
    """Schema for driver approval/rejection action"""
    action: str = Field(..., description="Action: 'approve' or 'reject'")
    rejection_reason: Optional[str] = Field(None, description="Reason for rejection (required if action is 'reject')")
    
    class Config:
        json_schema_extra = {
            "example": {
                "action": "approve"
            }
        }


class VendorCampaignInfo(BaseModel):
    """Campaign info for vendor"""
    id: int
    name: str
    campaign_type: str
    status: str
    start_date: Optional[date]
    end_date: Optional[date]
    locations: Optional[str]
    project_id: int
    project_name: Optional[str]


class VendorDriverInfo(BaseModel):
    """Driver info for vendor"""
    id: int
    name: str
    phone: Optional[str]
    email: Optional[str]
    license_number: Optional[str]
    is_active: bool


class VendorVehicleInfo(BaseModel):
    """Vehicle info for vendor"""
    id: int
    vehicle_number: str
    vehicle_type: Optional[str]
    is_available: bool
