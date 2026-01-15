from sqlalchemy import Column, String, Text
from sqlalchemy.orm import relationship
from app.models.base import Base, BaseModel

class Vendor(Base, BaseModel):
    __tablename__ = "vendors"
    
    name = Column(String(255), nullable=False)
    email = Column(String(255))
    phone = Column(String(20))
    address = Column(Text)
    contact_person = Column(String(255))
    company_website = Column(String(255))
    city = Column(String(100))
    category = Column(String(100))
    specifications = Column(Text)
    designation = Column(String(100))
    status = Column(String(50))
    remarks = Column(Text)
    
    # Relationships
    vehicles = relationship("Vehicle", back_populates="vendor", cascade="all, delete-orphan")
    drivers = relationship("Driver", back_populates="vendor", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="vendor", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="vendor", cascade="all, delete-orphan")
