from sqlalchemy import Column, String, Float, Date, ForeignKey, Enum as SQLEnum, Text
from sqlalchemy.orm import relationship
import enum
from app.models.base import Base, BaseModel
from sqlalchemy import Integer

class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class PaymentMethod(str, enum.Enum):
    BANK_TRANSFER = "bank_transfer"
    CHEQUE = "cheque"
    UPI = "upi"
    CASH = "cash"
    OTHER = "other"

class Payment(Base, BaseModel):
    __tablename__ = "payments"
    
    amount = Column(Float, nullable=False)
    payment_date = Column(Date)
    status = Column(SQLEnum(PaymentStatus, values_callable=lambda obj: [e.value for e in obj]), default=PaymentStatus.PENDING)
    payment_method = Column(SQLEnum(PaymentMethod, values_callable=lambda obj: [e.value for e in obj]))
    transaction_reference = Column(String(255))
    remarks = Column(Text)
    
    # Foreign Keys
    invoice_id = Column(Integer, ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False, unique=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id", ondelete="CASCADE"), nullable=False)
    
    # Relationships
    invoice = relationship("Invoice", back_populates="payment")
    vendor = relationship("Vendor", back_populates="payments")
