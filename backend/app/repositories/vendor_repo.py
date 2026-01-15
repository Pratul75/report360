from app.repositories.base_repo import BaseRepository
from app.models.vendor import Vendor
from sqlalchemy.ext.asyncio import AsyncSession

class VendorRepository(BaseRepository):
    def __init__(self):
        super().__init__(Vendor)
    
    async def get_active_vendors(self, db: AsyncSession):
        """Get all active vendors"""
        return await self.get_all(db, {"is_active": True})
