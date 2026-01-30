from sqlalchemy import Column, Integer, Date, DateTime, Text, Float, Boolean, ForeignKey, func, JSON as SA_JSON
from sqlalchemy.orm import relationship
from app.models.base import Base, BaseModel

class DailyActivityLog(Base, BaseModel):
    """Daily activity log submitted by driver for an assigned work/campaign"""
    __tablename__ = "daily_activity_logs"

    driver_assignment_id = Column(Integer, ForeignKey("driver_assignments.id", ondelete="CASCADE"), nullable=False, index=True)
    
    log_date = Column(Date, nullable=False, index=True, comment="Date of activity")
    
    # Core fields
    activity_details = Column(Text, nullable=True, comment="Description of work done")
    villages = Column(SA_JSON, nullable=True, comment="Array of village names visited")
    images = Column(SA_JSON, nullable=True, comment="Array of image URLs/identifiers")
    
    # Location (GPS)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location_address = Column(Text, nullable=True)
    
    # Dynamic fields (future-proof: flexible JSON for optional/custom fields)
    extra_data = Column(SA_JSON, nullable=True, comment="Dynamic JSON for additional fields (flexible, backward-compatible)")
    
    # Metadata
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, nullable=False, default=True)

    # Relationships
    driver_assignment = relationship("DriverAssignment")
    created_by = relationship("User", foreign_keys=[created_by_id])

    def __repr__(self):
        return f"<DailyActivityLog assignment={self.driver_assignment_id} date={self.log_date}>"

