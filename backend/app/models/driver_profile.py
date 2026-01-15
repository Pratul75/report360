from sqlalchemy import Column, String, Text, Float, Date, ForeignKey, Enum as SQLEnum, Boolean, DateTime
from sqlalchemy.orm import relationship
import enum
from app.models.base import Base, BaseModel
from sqlalchemy import Integer

class DriverProfile(Base, BaseModel):
    """Extended driver profile information for driver onboarding"""
    __tablename__ = "driver_profiles"
    
    driver_id = Column(Integer, ForeignKey("drivers.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    address = Column(Text)
    emergency_contact_name = Column(String(255))
    emergency_contact_phone = Column(String(20))
    blood_group = Column(String(10))
    profile_photo = Column(String(500))
    aadhar_number = Column(String(20))
    aadhar_photo = Column(String(500))
    is_profile_complete = Column(Boolean, default=False)
    
    # Relationships
    driver = relationship("Driver", backref="profile", foreign_keys=[driver_id])
    
    def __repr__(self):
        return f"<DriverProfile driver_id={self.driver_id}>"
