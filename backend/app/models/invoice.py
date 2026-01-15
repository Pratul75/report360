from sqlalchemy import Column, String, Float, Date, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum
from app.models.base import Base, BaseModel
from sqlalchemy import Integer

class InvoiceStatus(str, enum.Enum):
    PENDING = "pending"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"
    PAID = "paid"

class Invoice(Base, BaseModel):
    __tablename__ = "invoices"
    
    invoice_number = Column(String(100), unique=True, nullable=False)
    invoice_file = Column(String(500))  # File path or URL
    amount = Column(Float, nullable=False)
    invoice_date = Column(Date, nullable=False)
    status = Column(SQLEnum(InvoiceStatus), default=InvoiceStatus.PENDING)
    
    # Foreign Keys
    vendor_id = Column(Integer, ForeignKey("vendors.id", ondelete="CASCADE"), nullable=False)
    campaign_id = Column(Integer, ForeignKey("campaigns.id", ondelete="SET NULL"))
    
    # Relationships
    vendor = relationship("Vendor", back_populates="invoices")
    campaign = relationship("Campaign", back_populates="invoices")
    payment = relationship("Payment", back_populates="invoice", uselist=False, cascade="all, delete-orphan")
