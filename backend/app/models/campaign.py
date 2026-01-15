from sqlalchemy import Column, String, Text, Float, Date, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum
from app.models.base import Base, BaseModel
from sqlalchemy import Integer

class CampaignType(str, enum.Enum):
    L_SHAPE = "l_shape"
    BTL = "btl"
    ROADSHOW = "roadshow"
    SAMPLING = "sampling"
    OTHER = "other"

class CampaignStatus(str, enum.Enum):
    PLANNING = "planning"
    UPCOMING = "upcoming"
    RUNNING = "running"
    HOLD = "hold"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class Campaign(Base, BaseModel):
    __tablename__ = "campaigns"
    
    name = Column(String(255), nullable=False)
    description = Column(Text)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    campaign_type = Column(SQLEnum(CampaignType), nullable=False)
    status = Column(SQLEnum(CampaignStatus), default=CampaignStatus.PLANNING)
    start_date = Column(Date)
    end_date = Column(Date)
    budget = Column(Float)
    locations = Column(Text)
    
    # Relationships
    project = relationship("Project", back_populates="campaigns")
    expenses = relationship("Expense", back_populates="campaign", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="campaign", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="campaign", cascade="all, delete-orphan")
