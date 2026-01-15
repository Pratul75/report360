from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.analytics import DashboardStats
from app.services.dashboard_service import DashboardService
from app.core.security import get_current_user
from app.database.connection import get_db

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get dashboard statistics (Admin only)"""
    # Check if user is admin
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admin can access dashboard statistics"
        )
    
    service = DashboardService()
    return await service.get_dashboard_stats(db)
