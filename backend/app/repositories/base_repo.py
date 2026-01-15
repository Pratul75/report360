from typing import Optional, List, Dict, Any
from sqlalchemy import select, update, delete, func
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone

class BaseRepository:
    """Base repository with common CRUD operations using SQLAlchemy"""
    
    def __init__(self, model):
        self.model = model
    
    async def create(self, db: AsyncSession, data: Dict[str, Any]):
        """Create a new record"""
        obj = self.model(**data)
        db.add(obj)
        await db.commit()
        await db.refresh(obj)
        return obj
    
    async def get_by_id(self, db: AsyncSession, id: int):
        """Get record by ID (only active records)"""
        query = select(self.model).where(self.model.id == id)
        
        # Filter out soft-deleted records
        if hasattr(self.model, 'is_active'):
            query = query.where(self.model.is_active == 1)
        
        result = await db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_all(self, db: AsyncSession, filters: Dict[str, Any] = None, limit: int = 1000):
        """Get all records with optional filters"""
        query = select(self.model)
        
        # Always filter out soft-deleted records
        if hasattr(self.model, 'is_active'):
            query = query.where(self.model.is_active == 1)
        
        if filters:
            for key, value in filters.items():
                if hasattr(self.model, key):
                    query = query.where(getattr(self.model, key) == value)
        
        query = query.limit(limit)
        result = await db.execute(query)
        return result.scalars().all()
    
    async def update(self, db: AsyncSession, id: int, data: Dict[str, Any]):
        """Update record by ID"""
        data['updated_at'] = datetime.now(timezone.utc)
        
        stmt = update(self.model).where(self.model.id == id).values(**data)
        await db.execute(stmt)
        await db.commit()
        
        return await self.get_by_id(db, id)
    
    async def delete(self, db: AsyncSession, id: int) -> bool:
        """Soft delete record by ID"""
        stmt = update(self.model).where(self.model.id == id).values(
            is_active=0,
            updated_at=datetime.now(timezone.utc)
        )
        result = await db.execute(stmt)
        await db.commit()
        return result.rowcount > 0
    
    async def count(self, db: AsyncSession, filters: Dict[str, Any] = None) -> int:
        """Count records"""
        query = select(func.count(self.model.id))
        
        # Always filter out soft-deleted records
        if hasattr(self.model, 'is_active'):
            query = query.where(self.model.is_active == 1)
        
        if filters:
            for key, value in filters.items():
                if hasattr(self.model, key):
                    query = query.where(getattr(self.model, key) == value)
        
        result = await db.execute(query)
        return result.scalar()
