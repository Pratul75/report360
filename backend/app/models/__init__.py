from app.models.base import Base, BaseModel

# Import all models to ensure they are registered with SQLAlchemy
from app.models.user import User, UserRole
from app.models.client import Client
from app.models.project import Project
from app.models.campaign import Campaign, CampaignType, CampaignStatus
from app.models.vendor import Vendor
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.models.driver_assignment import DriverAssignment, AssignmentStatus, ApprovalStatus
from app.models.expense import Expense, ExpenseStatus
from app.models.report import Report
from app.models.promoter import Promoter
from app.models.promoter_activity import PromoterActivity
from app.models.invoice import Invoice, InvoiceStatus
from app.models.payment import Payment, PaymentStatus, PaymentMethod
from app.models.daily_activity_log import DailyActivityLog

__all__ = [
    'Base',
    'BaseModel',
    'User',
    'UserRole',
    'Client',
    'Project',
    'Campaign',
    'CampaignType',
    'CampaignStatus',
    'Vendor',
    'Vehicle',
    'Driver',
    'DriverAssignment',
    'AssignmentStatus',
    'ApprovalStatus',
    'Expense',
    'ExpenseStatus',
    'Report',
    'Promoter',
    'PromoterActivity',
    'Invoice',
    'InvoiceStatus',
    'Payment',
    'PaymentStatus',
    'PaymentMethod',
    'DailyActivityLog',
]
