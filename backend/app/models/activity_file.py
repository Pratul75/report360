from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.models.base import Base, BaseModel

class ActivityFile(Base):
    __tablename__ = "activity_files"

    id = Column(Integer, primary_key=True)
    activity_id = Column(Integer, ForeignKey("activities.id"))
    field_name = Column(String(100))
    file_path = Column(String(500))
    file_type = Column(String(100))
    created_at = Column(DateTime, default=func.now())
