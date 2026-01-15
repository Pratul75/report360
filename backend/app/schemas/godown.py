from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Godown Schemas
class GodownBase(BaseModel):
    name: str
    location: Optional[str] = None
    manager_name: Optional[str] = None
    contact_number: Optional[str] = None
    remarks: Optional[str] = None

class GodownCreate(GodownBase):
    pass

class GodownUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    manager_name: Optional[str] = None
    contact_number: Optional[str] = None
    remarks: Optional[str] = None

class GodownResponse(GodownBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Inventory Item Schemas
class InventoryItemBase(BaseModel):
    godown_id: int
    item_name: str
    item_code: str
    category: Optional[str] = None
    quantity: float = 0.0
    unit: Optional[str] = None
    min_stock_level: float = 0.0
    remarks: Optional[str] = None

class InventoryItemCreate(InventoryItemBase):
    pass

class InventoryItemUpdate(BaseModel):
    item_name: Optional[str] = None
    item_code: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    min_stock_level: Optional[float] = None
    remarks: Optional[str] = None

class InventoryItemResponse(InventoryItemBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    quantity: Optional[float] = None
    min_stock_level: Optional[float] = None
    
    class Config:
        from_attributes = True

class GodownDetailResponse(GodownResponse):
    """Godown with inventory items"""
    inventory_items: List[InventoryItemResponse] = []
    
    class Config:
        from_attributes = True

# Low Stock Alert
class LowStockAlert(BaseModel):
    item_id: int
    item_code: str
    item_name: str
    godown_id: int
    godown_name: str
    current_quantity: float
    min_stock_level: float
    unit: Optional[str] = None
    shortage: float  # min_stock_level - current_quantity
