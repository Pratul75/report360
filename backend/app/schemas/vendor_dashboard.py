from pydantic import BaseModel
from typing import List, Optional
from datetime import date
from app.schemas.campaign import CampaignResponse
from app.schemas.vehicle import VehicleResponse
from app.schemas.driver import DriverResponse
from app.schemas.invoice import InvoiceResponse
from app.schemas.payment import PaymentResponse

class VendorDashboardSummary(BaseModel):
    total_campaigns: int
    total_vehicles: int
    total_drivers: int
    total_invoices: int
    pending_payments: int
    total_revenue: float

class VendorDashboardData(BaseModel):
    summary: VendorDashboardSummary
    assigned_campaigns: List[CampaignResponse]
    vehicles: List[VehicleResponse]
    drivers: List[DriverResponse]
    invoices: List[InvoiceResponse]
    payments: List[PaymentResponse]

class VendorCampaignFilter(BaseModel):
    campaign_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class VendorInvoiceFilter(BaseModel):
    campaign_id: Optional[int] = None
    status: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
