from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import Dict, Any
from app.repositories.base_repo import BaseRepository
from app.models.project import Project
from app.models.project_field import ProjectField
import json
from datetime import datetime, timezone

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
            selectinload(Project.cs_user),
            selectinload(Project.fields)
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
            selectinload(Project.cs_user),
            selectinload(Project.fields)
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
            selectinload(Project.cs_user),
            selectinload(Project.fields)
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
            selectinload(Project.cs_user),
            selectinload(Project.fields)
        )
        
        result = await db.execute(query)
        return result.scalars().all()
    
    async def get_active_projects(self, db: AsyncSession):
        """Get active projects"""
        return await self.get_all(db, {"status": "active"})
        
    async def create(self, db, data):
        fields = data.pop("fields", [])

        project = Project(**data)
        db.add(project)
        await db.commit()
        await db.refresh(project)

        for f in fields:
            field = ProjectField(
                project_id=project.id,
                field_name=f["field_name"],
                field_type=f["field_type"],
                required=f.get("required", False),
                options=json.dumps(f.get("options", []))
            )
            db.add(field)

        await db.commit()
        return project
    
    async def update(self, db: AsyncSession, id: int, data: Dict[str, Any]):
        """Update project with fields handling"""
        # Extract fields before any processing
        fields = data.pop("fields", None)
        
        # Update project basic info
        data['updated_at'] = datetime.now(timezone.utc)
        stmt = update(Project).where(Project.id == id).values(**data)
        await db.execute(stmt)
        
        # Handle fields if provided (even empty list)
        if fields is not None:
            # Delete existing fields
            delete_stmt = delete(ProjectField).where(ProjectField.project_id == id)
            await db.execute(delete_stmt)
            
            # Create new fields
            for f in fields:
                field = ProjectField(
                    project_id=id,
                    field_name=f["field_name"],
                    field_type=f["field_type"],
                    required=f.get("required", False),
                    options=json.dumps(f.get("options", []))
                )
                db.add(field)
        
        await db.commit()
        return await self.get_by_id(db, id)