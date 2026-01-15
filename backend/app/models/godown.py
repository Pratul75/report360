from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base

class Godown(Base):
    """Warehouse/Godown model"""
    __tablename__ = "godowns"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    location = Column(String(255), nullable=True)
    manager_name = Column(String(255), nullable=True)
    contact_number = Column(String(20), nullable=True)
    remarks = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    inventory_items = relationship("InventoryItem", back_populates="godown", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Godown(id={self.id}, name='{self.name}', is_active={self.is_active})>"


class InventoryItem(Base):
    """Inventory items stored in godowns"""
    __tablename__ = "inventory_items"
    
    id = Column(Integer, primary_key=True, index=True)
    godown_id = Column(Integer, ForeignKey("godowns.id"), nullable=False, index=True)
    item_name = Column(String(255), nullable=False, index=True)
    item_code = Column(String(100), nullable=False, unique=True, index=True)
    category = Column(String(100), nullable=True)
    quantity = Column(Float, default=0.0)
    unit = Column(String(50), nullable=True)  # kg, pcs, box, etc
    min_stock_level = Column(Float, default=0.0)
    remarks = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    godown = relationship("Godown", back_populates="inventory_items")
    
    def __repr__(self):
        return f"<InventoryItem(id={self.id}, code='{self.item_code}', qty={self.quantity})>"
