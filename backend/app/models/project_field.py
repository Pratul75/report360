from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.models.base import Base

class ProjectField(Base):
    __tablename__ = "project_fields"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))
    field_name = Column(String(255))
    field_type = Column(String(50))  # text, number, date, dropdown
    required = Column(Boolean, default=False)
    options = Column(Text, nullable=True)  # JSON string
    
    # Relationship
    project = relationship("Project", back_populates="fields")
