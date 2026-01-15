from sqlalchemy import Column, String, Text, Float, Date, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum
from app.models.base import Base, BaseModel
from sqlalchemy import Integer

class ExpenseStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class Expense(Base, BaseModel):
    __tablename__ = "expenses"
    
    campaign_id = Column(Integer, ForeignKey("campaigns.id", ondelete="CASCADE"))
    driver_id = Column(Integer, ForeignKey("drivers.id", ondelete="SET NULL"))
    expense_type = Column(String(100), nullable=False)
    amount = Column(Float, nullable=False)
    description = Column(Text)
    bill_url = Column(String(500))
    bill_image = Column(String(500))
    status = Column(SQLEnum(ExpenseStatus), default=ExpenseStatus.PENDING)
    submitted_date = Column(Date)
    approved_date = Column(Date)
    
    # Relationships
    campaign = relationship("Campaign", back_populates="expenses")
    driver = relationship("Driver", back_populates="expenses")
