from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from app.models.invoice import InvoiceStatus

class InvoiceBase(BaseModel):
    invoice_number: str
    invoice_file: Optional[str] = None
    amount: float
    invoice_date: date
    status: Optional[InvoiceStatus] = InvoiceStatus.PENDING
    vendor_id: int
    campaign_id: Optional[int] = None

class InvoiceCreate(BaseModel):
    invoice_number: str
    invoice_file: Optional[str] = None
    amount: float
    invoice_date: date
    campaign_id: Optional[int] = None

class InvoiceUpdate(BaseModel):
    invoice_number: Optional[str] = None
    invoice_file: Optional[str] = None
    amount: Optional[float] = None
    invoice_date: Optional[date] = None
    status: Optional[InvoiceStatus] = None
    campaign_id: Optional[int] = None

class InvoiceResponse(InvoiceBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
