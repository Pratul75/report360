from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text, Boolean, Date
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
from database import Base

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    CLIENT_SERVICING = "client_servicing"
    OPERATIONS_MANAGER = "operations_manager"
    ACCOUNTS = "accounts"
    VENDOR = "vendor"
    CLIENT = "client"

class CampaignStatus(str, enum.Enum):
    PLANNING = "planning"
    UPCOMING = "upcoming"
    RUNNING = "running"
    HOLD = "hold"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class CampaignType(str, enum.Enum):
    L_SHAPE = "l_shape"
    BTL = "btl"
    ROADSHOW = "roadshow"
    SAMPLING = "sampling"
    OTHER = "other"

class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    PAID = "paid"
    REJECTED = "rejected"

class ExpenseStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    phone = Column(String(20))
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class Client(Base):
    __tablename__ = "clients"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    company = Column(String(255))
    email = Column(String(255))
    phone = Column(String(20))
    address = Column(Text)
    contact_person = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    projects = relationship("Project", back_populates="client")

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    budget = Column(Float)
    start_date = Column(Date)
    end_date = Column(Date)
    status = Column(String(50), default="active")
    assigned_cs = Column(String(255))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    client = relationship("Client", back_populates="projects")
    campaigns = relationship("Campaign", back_populates="project")

class Vendor(Base):
    __tablename__ = "vendors"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255))
    phone = Column(String(20))
    address = Column(Text)
    contact_person = Column(String(255))
    # New fields
    company_website = Column(String(255))
    city = Column(String(100))
    category = Column(String(100))
    specifications = Column(Text)
    designation = Column(String(100))
    status = Column(String(50))
    remarks = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    vehicles = relationship("Vehicle", back_populates="vendor")
    drivers = relationship("Driver", back_populates="vendor")

class Vehicle(Base):
    __tablename__ = "vehicles"
    
    id = Column(Integer, primary_key=True, index=True)
    vehicle_number = Column(String(50), unique=True, nullable=False)
    vehicle_type = Column(String(100))
    capacity = Column(String(100))
    vendor_id = Column(Integer, ForeignKey("vendors.id"))
    rc_validity = Column(Date)
    insurance_validity = Column(Date)
    permit_validity = Column(Date)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    vendor = relationship("Vendor", back_populates="vehicles")
    campaigns = relationship("CampaignVehicle", back_populates="vehicle")

class Driver(Base):
    __tablename__ = "drivers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    phone = Column(String(20))
    email = Column(String(255))
    license_number = Column(String(100))
    license_validity = Column(Date)
    license_image = Column(String(255))
    vendor_id = Column(Integer, ForeignKey("vendors.id"))
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    vendor = relationship("Vendor", back_populates="drivers")
    vehicle = relationship("Vehicle")
    campaigns = relationship("CampaignDriver", back_populates="driver")
    expenses = relationship("Expense", back_populates="driver")

class Promoter(Base):
    __tablename__ = "promoters"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    phone = Column(String(20))
    email = Column(String(255))
    specialty = Column(String(255))
    language = Column(String(100))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    campaigns = relationship("CampaignPromoter", back_populates="promoter")

class Campaign(Base):
    __tablename__ = "campaigns"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    campaign_type = Column(Enum(CampaignType), nullable=False)
    status = Column(Enum(CampaignStatus), default=CampaignStatus.PLANNING)
    start_date = Column(Date)
    end_date = Column(Date)
    budget = Column(Float)
    locations = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    project = relationship("Project", back_populates="campaigns")
    vehicles = relationship("CampaignVehicle", back_populates="campaign")
    drivers = relationship("CampaignDriver", back_populates="campaign")
    promoters = relationship("CampaignPromoter", back_populates="campaign")
    expenses = relationship("Expense", back_populates="campaign")
    reports = relationship("Report", back_populates="campaign")

class CampaignVehicle(Base):
    __tablename__ = "campaign_vehicles"
    
    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    assigned_date = Column(Date)
    
    campaign = relationship("Campaign", back_populates="vehicles")
    vehicle = relationship("Vehicle", back_populates="campaigns")

class CampaignDriver(Base):
    __tablename__ = "campaign_drivers"
    
    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False)
    assigned_date = Column(Date)
    
    campaign = relationship("Campaign", back_populates="drivers")
    driver = relationship("Driver", back_populates="campaigns")

class CampaignPromoter(Base):
    __tablename__ = "campaign_promoters"
    
    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=False)
    promoter_id = Column(Integer, ForeignKey("promoters.id"), nullable=False)
    assigned_date = Column(Date)
    
    campaign = relationship("Campaign", back_populates="promoters")
    promoter = relationship("Promoter", back_populates="campaigns")

class Expense(Base):
    __tablename__ = "expenses"
    
    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"))
    driver_id = Column(Integer, ForeignKey("drivers.id"))
    expense_type = Column(String(100))
    amount = Column(Float, nullable=False)
    description = Column(Text)
    bill_url = Column(String(500))
    status = Column(Enum(ExpenseStatus), default=ExpenseStatus.PENDING)
    submitted_date = Column(Date)
    approved_date = Column(Date)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    campaign = relationship("Campaign", back_populates="expenses")
    driver = relationship("Driver", back_populates="expenses")

class Report(Base):
    __tablename__ = "reports"
    
    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=False)
    report_date = Column(Date, nullable=False)
    locations_covered = Column(Text)
    km_travelled = Column(Float)
    photos_url = Column(Text)
    gps_data = Column(Text)
    notes = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    campaign = relationship("Campaign", back_populates="reports")

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"))
    driver_id = Column(Integer, ForeignKey("drivers.id"))
    amount = Column(Float, nullable=False)
    payment_type = Column(String(100))
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    payment_date = Column(Date)
    notes = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
