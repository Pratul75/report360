from sqlalchemy import Column, String, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base, BaseModel
from sqlalchemy import Integer

class Vehicle(Base, BaseModel):
    __tablename__ = "vehicles"
    
    vehicle_number = Column(String(50), unique=True, nullable=False)
    vehicle_type = Column(String(100))
    capacity = Column(String(100))
    vendor_id = Column(Integer, ForeignKey("vendors.id", ondelete="SET NULL"))
    rc_validity = Column(Date)
    insurance_validity = Column(Date)
    permit_validity = Column(Date)
    rc_image = Column(String(500))  # Path to RC document image
    insurance_image = Column(String(500))  # Path to insurance document image
    
    # Relationships
    vendor = relationship("Vendor", back_populates="vehicles")
