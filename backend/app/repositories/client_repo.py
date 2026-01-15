from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.repositories.base_repo import BaseRepository
from app.models.client import Client

class ClientRepository(BaseRepository):
    def __init__(self):
        super().__init__(Client)
    
    async def get_all(self, db: AsyncSession, filters: dict = None):
        """Get all clients with projects loaded"""
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
            selectinload(Client.projects)
        )
        
        result = await db.execute(query)
        return result.scalars().all()
    
    async def get_by_id(self, db: AsyncSession, id: int):
        """Get client by ID with projects loaded"""
        query = select(Client).where(Client.id == id)
        
        # Filter out soft-deleted records
        if hasattr(Client, 'is_active'):
            query = query.where(Client.is_active == 1)
        
        # Eagerly load relationships
        query = query.options(
            selectinload(Client.projects)
        )
        
        result = await db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_active_clients(self, db: AsyncSession):
        """Get all active clients"""
        return await self.get_all(db, {"is_active": True})
    
    async def search_by_name(self, db: AsyncSession, name: str):
        """Search clients by name"""
        query = select(Client).where(
            Client.name.ilike(f"%{name}%"),
            Client.is_active == True
        )
        result = await db.execute(query)
        return result.scalars().all()
