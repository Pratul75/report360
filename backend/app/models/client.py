from sqlalchemy import Column, String, Text
from sqlalchemy.orm import relationship
from app.models.base import Base, BaseModel

class Client(Base, BaseModel):
    __tablename__ = "clients"
    
    name = Column(String(255), nullable=False)
    company = Column(String(255))
    email = Column(String(255))
    phone = Column(String(20))
    address = Column(Text)
    contact_person = Column(String(255))
    
    # Relationships
    projects = relationship("Project", back_populates="client", cascade="all, delete-orphan")
