from app.repositories.base_repo import BaseRepository
from app.models.user import User, UserRole
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

class UserRepository(BaseRepository):
    """Repository for User operations"""
    
    def __init__(self):
        super().__init__(User)
    
    async def get_by_email(self, db: AsyncSession, email: str):
        """Get user by email"""
        result = await db.execute(
            select(self.model).where(self.model.email == email)
        )
        return result.scalar_one_or_none()
    
    async def get_active_users(self, db: AsyncSession):
        """Get all active users"""
        result = await db.execute(
            select(self.model).where(self.model.is_active == True)
        )
        return result.scalars().all()
    
    async def get_by_role(self, db: AsyncSession, role: UserRole):
        """Get users by role"""
        result = await db.execute(
            select(self.model).where(
                self.model.role == role,
                self.model.is_active == True
            )
        )
        return result.scalars().all()
