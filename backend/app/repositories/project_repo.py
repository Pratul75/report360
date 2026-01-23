from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.repositories.base_repo import BaseRepository
from app.models.project import Project

class ProjectRepository(BaseRepository):
    def __init__(self):
        super().__init__(Project)
    
    async def get_all(self, db: AsyncSession, filters: dict = None):
        """Get all projects with campaigns, client, and CS user loaded"""
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
            selectinload(Project.campaigns),
            selectinload(Project.client),
            selectinload(Project.cs_user)
        )
        
        result = await db.execute(query)
        return result.scalars().all()
    
    async def get_by_id(self, db: AsyncSession, id: int):
        """Get project by ID with campaigns, client, and CS user loaded"""
        query = select(Project).where(Project.id == id)
        
        # Filter out soft-deleted records
        if hasattr(Project, 'is_active'):
            query = query.where(Project.is_active == 1)
        
        # Eagerly load relationships
        query = query.options(
            selectinload(Project.campaigns),
            selectinload(Project.client),
            selectinload(Project.cs_user)
        )
        
        result = await db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_by_client(self, db: AsyncSession, client_id: int):
        """Get projects by client ID"""
        query = select(Project).where(Project.client_id == client_id)
        
        # Eagerly load relationships
        query = query.options(
            selectinload(Project.campaigns),
            selectinload(Project.client),
            selectinload(Project.cs_user)
        )
        
        result = await db.execute(query)
        return result.scalars().all()
    
    async def get_by_assigned_cs(self, db: AsyncSession, user_id: int):
        """Get projects assigned to a specific CS user"""
        query = select(Project).where(Project.assigned_cs == user_id)
        
        # Filter out soft-deleted records
        if hasattr(Project, 'is_active'):
            query = query.where(Project.is_active == 1)
        
        # Eagerly load relationships
        query = query.options(
            selectinload(Project.campaigns),
            selectinload(Project.client),
            selectinload(Project.cs_user)
        )
        
        result = await db.execute(query)
        return result.scalars().all()
    
    async def get_active_projects(self, db: AsyncSession):
        """Get active projects"""
        return await self.get_all(db, {"status": "active"})
