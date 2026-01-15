from app.repositories.base_repo import BaseRepository
from app.models.godown import Godown, InventoryItem
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import and_

class GodownRepository(BaseRepository):
    def __init__(self):
        super().__init__(Godown)
    
    async def get_active_godowns(self, db: AsyncSession):
        """Get all active godowns"""
        return await self.get_all(db, {"is_active": True})


class InventoryItemRepository(BaseRepository):
    def __init__(self):
        super().__init__(InventoryItem)
    
    async def get_active_items(self, db: AsyncSession):
        """Get all active inventory items"""
        return await self.get_all(db, {"is_active": True})
    
    async def get_items_by_godown(self, db: AsyncSession, godown_id: int):
        """Get all active items for a specific godown"""
        return await self.get_all(db, {"godown_id": godown_id, "is_active": True})
    
    async def get_low_stock_items(self, db: AsyncSession):
        """Get all items below minimum stock level"""
        from sqlalchemy import select, and_
        query = select(InventoryItem).where(
            and_(
                InventoryItem.is_active == True,
                InventoryItem.quantity < InventoryItem.min_stock_level
            )
        )
        result = await db.execute(query)
        return result.scalars().all()
    
    async def get_by_code(self, db: AsyncSession, item_code: str):
        """Get inventory item by code"""
        from sqlalchemy import select
        result = await db.execute(
            select(InventoryItem).filter(InventoryItem.item_code == item_code)
        )
        return result.scalar_one_or_none()
