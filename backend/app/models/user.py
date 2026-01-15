from sqlalchemy import Column, String, Enum as SQLEnum, Integer, ForeignKey
from sqlalchemy.orm import relationship
import enum
from app.models.base import Base, BaseModel

class UserRole(str, enum.Enum):
    # Existing roles (DO NOT MODIFY)
    ADMIN = "admin"
    CLIENT_SERVICING = "client_servicing"
    OPERATIONS_MANAGER = "operations_manager"
    ACCOUNTS = "accounts"
    VENDOR = "vendor"
    CLIENT = "client"
    
    # New roles (Extension)
    SALES = "sales"
    PURCHASE = "purchase"
    OPERATOR = "operator"
    DRIVER = "driver"
    PROMOTER = "promoter"
    ANCHOR = "anchor"
    VEHICLE_MANAGER = "vehicle_manager"
    GODOWN_MANAGER = "godown_manager"

class User(Base, BaseModel):
    __tablename__ = "users"
    
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    phone = Column(String(20))
    password_hash = Column(String(255), nullable=False)
    password_hint = Column(String(255), nullable=True)  # Admin reference for password management
    role = Column(SQLEnum(UserRole, values_callable=lambda obj: [e.value for e in obj]), nullable=False)
    vendor_id = Column(Integer, ForeignKey("vendors.id", ondelete="SET NULL"), nullable=True)
    
    # Relationships
    vendor = relationship("Vendor", backref="users")
