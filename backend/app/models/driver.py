from sqlalchemy import Column, String, Date, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from app.models.base import Base, BaseModel
from sqlalchemy import Integer

class Driver(Base, BaseModel):
    __tablename__ = "drivers"
    
    name = Column(String(255), nullable=False)
    phone = Column(String(20))
    email = Column(String(255))
    license_number = Column(String(100))
    license_validity = Column(Date)
    license_image = Column(String(255))
    vendor_id = Column(Integer, ForeignKey("vendors.id", ondelete="SET NULL"))
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="SET NULL"))  # Assigned vehicle
    is_active = Column(Boolean, default=True, nullable=False)
    inactive_reason = Column(Text, nullable=True)
    
    # Relationships
    vendor = relationship("Vendor", back_populates="drivers")
    vehicle = relationship("Vehicle", foreign_keys=[vehicle_id])
    expenses = relationship("Expense", back_populates="driver", cascade="all, delete-orphan")
