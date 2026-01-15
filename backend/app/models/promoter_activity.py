from sqlalchemy import Column, String, Text, Integer, Date, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.models.base import Base, BaseModel
from datetime import datetime, timezone

class PromoterActivity(Base, BaseModel):
    """
    Promoter Activity tracking model
    Tracks individual promotion activities with images, attendance, and location data
    """
    __tablename__ = "promoter_activities"
    
    # Promoter Information
    promoter_id = Column(Integer, ForeignKey("promoters.id", ondelete="CASCADE"), nullable=False, index=True)
    promoter_name = Column(String(255), nullable=False)  # Denormalized for quick access
    
    # Campaign & Location
    campaign_id = Column(Integer, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, index=True)
    village_name = Column(String(255), nullable=False, index=True)
    activity_date = Column(Date, nullable=False, index=True)
    
    # Activity Tracking
    people_attended = Column(Integer, nullable=False, default=0)
    activity_count = Column(Integer, nullable=False, default=0)
    
    # Image Storage (file paths)
    before_image = Column(String(500))  # Path: /uploads/promoter_activities/{id}/before.jpg
    during_image = Column(String(500))  # Path: /uploads/promoter_activities/{id}/during.jpg
    after_image = Column(String(500))   # Path: /uploads/promoter_activities/{id}/after.jpg
    
    # Additional Info
    specialty = Column(String(255))
    language = Column(String(100))
    remarks = Column(Text)
    
    # Metadata
    created_by_id = Column(Integer, ForeignKey("users.id"))
    
    # Relationships
    promoter = relationship("Promoter", backref="activities")
    campaign = relationship("Campaign", backref="promoter_activities")
    created_by = relationship("User", foreign_keys=[created_by_id])
    
    def __repr__(self):
        return f"<PromoterActivity {self.promoter_name} - {self.village_name} on {self.activity_date}>"
    
    # Validation
    def validate_numeric_fields(self):
        """Ensure no negative values"""
        if self.people_attended and self.people_attended < 0:
            raise ValueError("people_attended cannot be negative")
        if self.activity_count and self.activity_count < 0:
            raise ValueError("activity_count cannot be negative")
