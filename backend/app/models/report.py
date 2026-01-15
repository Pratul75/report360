from sqlalchemy import Column, Text, Float, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base, BaseModel
from sqlalchemy import Integer

class Report(Base, BaseModel):
    __tablename__ = "reports"
    
    campaign_id = Column(Integer, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False)
    report_date = Column(Date, nullable=False)
    locations_covered = Column(Text)
    km_travelled = Column(Float)
    photos_url = Column(Text)
    gps_data = Column(Text)
    notes = Column(Text)
    
    # Relationships
    campaign = relationship("Campaign", back_populates="reports")
