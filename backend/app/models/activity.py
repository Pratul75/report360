from sqlalchemy import Column, Integer, Float, Text, JSON, String
from app.database.base import Base

class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True)
    project_id = Column(Integer)
    campaign_id = Column(Integer)
    latitude = Column(Float)
    longitude = Column(Float)
    location_address = Column(Text)
    payload = Column(JSON)
    photo_path = Column(String)
