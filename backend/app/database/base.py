from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field

class MongoBaseModel(BaseModel):
    """Base model for MongoDB documents"""
    id: Optional[str] = Field(None, alias="_id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

def doc_to_dict(doc: dict) -> dict:
    """Convert MongoDB document to dict with string ID"""
    if doc and "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    return doc
