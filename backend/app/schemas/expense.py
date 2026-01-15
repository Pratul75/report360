from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from enum import Enum

class ExpenseStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class ExpenseBase(BaseModel):
    campaign_id: Optional[int] = None
    driver_id: Optional[int] = None
    expense_type: str
    amount: float
    description: Optional[str] = None
    bill_url: Optional[str] = None
    bill_image: Optional[str] = None
    submitted_date: Optional[date] = None

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseUpdate(BaseModel):
    expense_type: Optional[str] = None
    amount: Optional[float] = None
    description: Optional[str] = None
    bill_url: Optional[str] = None
    bill_image: Optional[str] = None
    status: Optional[ExpenseStatus] = None

class ExpenseResponse(ExpenseBase):
    id: int
    status: ExpenseStatus
    approved_date: Optional[date]
    created_at: datetime
    
    class Config:
        from_attributes = True
