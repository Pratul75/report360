from app.repositories.base_repo import BaseRepository
from app.models.promoter import Promoter
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

class PromoterRepository(BaseRepository):
    """Repository for Promoter operations"""
    
    def __init__(self):
        super().__init__(Promoter)
    
    async def get_active_promoters(self, db: AsyncSession):
        """Get all active promoters"""
        result = await db.execute(
            select(self.model).where(self.model.is_active == True)
        )
        return result.scalars().all()
    
    async def get_by_specialty(self, db: AsyncSession, specialty: str):
        """Get promoters by specialty"""
        result = await db.execute(
            select(self.model).where(
                self.model.specialty == specialty,
                self.model.is_active == True
            )
        )
        return result.scalars().all()
    
    async def get_by_language(self, db: AsyncSession, language: str):
        """Get promoters by language"""
        result = await db.execute(
            select(self.model).where(
                self.model.language == language,
                self.model.is_active == True
            )
        )
        return result.scalars().all()
