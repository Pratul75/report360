from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.repositories.base_repo import BaseRepository
from app.models.report import Report

class ReportRepository(BaseRepository):
    def __init__(self):
        super().__init__(Report)
    
    async def get_all(self, db: AsyncSession, filters: dict = None):
        """Get all reports with campaign loaded"""
        query = select(self.model)
        
        # Apply filters
        if filters:
            for key, value in filters.items():
                if hasattr(self.model, key):
                    query = query.where(getattr(self.model, key) == value)
        
        # Filter out soft-deleted records
        if hasattr(self.model, 'is_active'):
            query = query.where(self.model.is_active == 1)
        
        # Eagerly load relationships
        query = query.options(
            selectinload(Report.campaign)
        )
        
        result = await db.execute(query)
        return result.scalars().all()
    
    async def get_by_id(self, db: AsyncSession, id: int):
        """Get report by ID with campaign loaded"""
        query = select(Report).where(Report.id == id)
        
        # Filter out soft-deleted records
        if hasattr(Report, 'is_active'):
            query = query.where(Report.is_active == 1)
        
        # Eagerly load relationships
        query = query.options(
            selectinload(Report.campaign)
        )
        
        result = await db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_by_campaign(self, db: AsyncSession, campaign_id: int):
        """Get reports by campaign ID"""
        query = select(Report).where(Report.campaign_id == campaign_id)
        query = query.options(selectinload(Report.campaign))
        result = await db.execute(query)
        return result.scalars().all()
