from sqlalchemy import Column, String, Text, Float, Date, ForeignKey, Integer
from sqlalchemy.orm import relationship
from app.models.base import Base, BaseModel

class Project(Base, BaseModel):
    __tablename__ = "projects"
    
    name = Column(String(255), nullable=False)
    description = Column(Text)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    assigned_cs = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    budget = Column(Float)
    start_date = Column(Date)
    end_date = Column(Date)
    status = Column(String(50), default="active")
    
    # Relationships
    client = relationship("Client", back_populates="projects")
    cs_user = relationship("User", foreign_keys=[assigned_cs], backref="assigned_projects")
    campaigns = relationship("Campaign", back_populates="project", cascade="all, delete-orphan")
