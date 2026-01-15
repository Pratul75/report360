from app.repositories.godown_repo import GodownRepository, InventoryItemRepository
from app.schemas.godown import GodownCreate, GodownUpdate, InventoryItemCreate, InventoryItemUpdate, LowStockAlert
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

class GodownService:
    def __init__(self):
        self.repo = GodownRepository()
    
    async def create_godown(self, db: AsyncSession, godown_data: GodownCreate):
        """Create a new godown"""
        godown = await self.repo.create(db, godown_data.model_dump())
        return await self.repo.get_by_id(db, godown.id)
    
    async def get_all_godowns(self, db: AsyncSession):
        """Get all active godowns"""
        return await self.repo.get_active_godowns(db)
    
    async def get_godown(self, db: AsyncSession, godown_id: int):
        """Get godown by ID"""
        godown = await self.repo.get_by_id(db, godown_id)
        if not godown:
            raise HTTPException(status_code=404, detail="Godown not found")
        return godown
    
    async def update_godown(self, db: AsyncSession, godown_id: int, godown_data: GodownUpdate):
        """Update godown"""
        godown = await self.get_godown(db, godown_id)
        updated_data = godown_data.model_dump(exclude_unset=True)
        updated = await self.repo.update(db, godown_id, updated_data)
        return updated
    
    async def delete_godown(self, db: AsyncSession, godown_id: int):
        """Soft delete godown"""
        await self.get_godown(db, godown_id)
        await self.repo.delete(db, godown_id)


class InventoryService:
    def __init__(self):
        self.repo = InventoryItemRepository()
        self.godown_repo = GodownRepository()
    
    async def create_item(self, db: AsyncSession, item_data: InventoryItemCreate):
        """Create a new inventory item"""
        # Verify godown exists
        godown = await self.godown_repo.get_by_id(db, item_data.godown_id)
        if not godown:
            raise HTTPException(status_code=404, detail="Godown not found")
        
        # Check if item_code already exists
        existing = await self.repo.get_by_code(db, item_data.item_code)
        if existing:
            raise HTTPException(status_code=400, detail="Item code already exists")
        
        item = await self.repo.create(db, item_data.model_dump())
        return await self.repo.get_by_id(db, item.id)
    
    async def get_all_items(self, db: AsyncSession):
        """Get all active inventory items"""
        return await self.repo.get_active_items(db)
    
    async def get_items_by_godown(self, db: AsyncSession, godown_id: int):
        """Get all items for a specific godown"""
        # Verify godown exists
        godown = await self.godown_repo.get_by_id(db, godown_id)
        if not godown:
            raise HTTPException(status_code=404, detail="Godown not found")
        
        return await self.repo.get_items_by_godown(db, godown_id)
    
    async def get_item(self, db: AsyncSession, item_id: int):
        """Get item by ID"""
        item = await self.repo.get_by_id(db, item_id)
        if not item:
            raise HTTPException(status_code=404, detail="Inventory item not found")
        return item
    
    async def update_item(self, db: AsyncSession, item_id: int, item_data: InventoryItemUpdate):
        """Update inventory item"""
        item = await self.get_item(db, item_id)
        
        # If item_code is being updated, check for duplicates
        if item_data.item_code and item_data.item_code != item.item_code:
            existing = await self.repo.get_by_code(db, item_data.item_code)
            if existing:
                raise HTTPException(status_code=400, detail="Item code already exists")
        
        updated_data = item_data.model_dump(exclude_unset=True)
        updated = await self.repo.update(db, item_id, updated_data)
        return updated
    
    async def delete_item(self, db: AsyncSession, item_id: int):
        """Soft delete inventory item"""
        await self.get_item(db, item_id)
        await self.repo.delete(db, item_id)
    
    async def get_low_stock_items(self, db: AsyncSession):
        """Get all items below minimum stock level with alerts"""
        items = await self.repo.get_low_stock_items(db)
        alerts = []
        
        for item in items:
            godown = await self.godown_repo.get_by_id(db, item.godown_id)
            alerts.append(LowStockAlert(
                item_id=item.id,
                item_code=item.item_code,
                item_name=item.item_name,
                godown_id=item.godown_id,
                godown_name=godown.name if godown else "Unknown",
                current_quantity=item.quantity,
                min_stock_level=item.min_stock_level,
                unit=item.unit,
                shortage=item.min_stock_level - item.quantity
            ))
        
        return alerts
