from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import date, datetime
from enum import Enum

class ExpenseStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class SubmitterDetails(BaseModel):
    """Details of the user who submitted the expense"""
    id: int
    name: str
    phone: Optional[str] = None
    role: str
    
    class Config:
        from_attributes = True

class ExpenseBase(BaseModel):
    campaign_id: Optional[int] = None
    driver_id: Optional[int] = None
    expense_type: str
    amount: float
    description: Optional[str] = None
    bill_url: Optional[str] = None
    bill_image: Optional[str] = None
    submitted_date: Optional[date] = None
    submitted_by: Optional[int] = None

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseUpdate(BaseModel):
    expense_type: Optional[str] = None
    amount: Optional[float] = None
    description: Optional[str] = None
    bill_url: Optional[str] = None
    bill_image: Optional[str] = None
    status: Optional[ExpenseStatus] = None

class ExpenseResponse(BaseModel):
    id: int
    campaign_id: Optional[int] = None
    driver_id: Optional[int] = None
    expense_type: str
    amount: float
    description: Optional[str] = None
    bill_url: Optional[str] = None
    bill_image: Optional[str] = None
    submitted_date: Optional[date] = None
    submitted_by: Optional[int] = None
    status: ExpenseStatus
    approved_date: Optional[date]
    created_at: datetime
    submitted_by_user: Optional[SubmitterDetails] = None
    
    class Config:
        from_attributes = True
