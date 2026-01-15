from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Dict
from app.database.connection import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.services.vendor_dashboard_service import VendorDashboardService
from app.schemas.vendor_dashboard import VendorDashboardData

router = APIRouter(prefix="/vendor-dashboard", tags=["vendor-dashboard"])

@router.get("", response_model=VendorDashboardData)
async def get_vendor_dashboard(
    vendor_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get vendor dashboard data.
    - Vendors: See only their own data
    - Admins: Can see all vendors or specific vendor by providing vendor_id
    """
    service = VendorDashboardService(db)
    return await service.get_dashboard_data(current_user, vendor_id)

@router.get("/menu-counts", response_model=Dict[str, int])
async def get_menu_counts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get counts for dynamic menu visibility.
    Returns vehicle_count and driver_count for the vendor.
    """
    service = VendorDashboardService(db)
    return await service.get_menu_counts(current_user)
