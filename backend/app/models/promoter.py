from sqlalchemy import Column, String
from app.models.base import Base, BaseModel

class Promoter(Base, BaseModel):
    __tablename__ = "promoters"
    
    name = Column(String(255), nullable=False)
    phone = Column(String(20))
    email = Column(String(255))
    specialty = Column(String(255))
    language = Column(String(100))
