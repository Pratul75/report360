from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from app.models.payment import PaymentStatus, PaymentMethod

class PaymentBase(BaseModel):
    amount: float
    payment_date: Optional[date] = None
    status: Optional[PaymentStatus] = PaymentStatus.PENDING
    payment_method: Optional[PaymentMethod] = None
    transaction_reference: Optional[str] = None
    remarks: Optional[str] = None
    invoice_id: int
    vendor_id: int

class PaymentCreate(BaseModel):
    amount: float
    payment_date: Optional[date] = None
    status: Optional[PaymentStatus] = PaymentStatus.PENDING
    payment_method: Optional[PaymentMethod] = None
    transaction_reference: Optional[str] = None
    remarks: Optional[str] = None
    invoice_id: int

class PaymentUpdate(BaseModel):
    amount: Optional[float] = None
    payment_date: Optional[date] = None
    status: Optional[PaymentStatus] = None
    payment_method: Optional[PaymentMethod] = None
    transaction_reference: Optional[str] = None
    remarks: Optional[str] = None

class PaymentResponse(PaymentBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
