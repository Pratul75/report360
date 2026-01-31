from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from datetime import date
from pydantic import BaseModel

from app.database.connection import get_db
from app.core.security import get_current_user
from app.api.dependencies import require_permission
from app.core.role_permissions import Permission
from app.services.driver_dashboard_service import DriverDashboardService
from app.models.driver import Driver

router = APIRouter(
    prefix="/driver-dashboard",
    tags=["Driver Dashboard"]
)


# Pydantic Models
class ProfileUpdateRequest(BaseModel):
    address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    blood_group: Optional[str] = None
    aadhar_number: Optional[str] = None


class StartKMRequest(BaseModel):
    latitude: float
    longitude: float
    start_km_photo: Optional[str] = None  # Base64 encoded image


class EndKMRequest(BaseModel):
    latitude: float
    longitude: float
    end_km_photo: Optional[str] = None  # Base64 encoded image


# Helper function to get driver_id from user
async def get_driver_id_from_user(current_user: dict, db: AsyncSession) -> Optional[int]:
    """
    Extract driver_id from current user by matching email.
    For driver role, finds the driver record with matching email.
    """
    if current_user.get("role") == "driver":
        user_email = current_user.get("email")
        if not user_email:
            return None
        
        # Find driver by email
        query = select(Driver).where(Driver.email == user_email)
        result = await db.execute(query)
        driver = result.scalars().first()
        
        if driver:
            return driver.id
    return None


# Driver-Only Endpoints
@router.get(
    "/me",
    dependencies=[Depends(require_permission(Permission.DRIVER_DASHBOARD_VIEW))]
)
async def get_my_dashboard(
    target_date: Optional[date] = Query(None, description="Target date (default: today)"),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get driver's own dashboard data
    Driver can see their own data
    Admin/Sales/Client Servicing should use /driver-dashboard/driver/{id} endpoint
    """
    # Get driver_id by matching email from drivers table
    if current_user.get("role") == "driver":
        driver_id = await get_driver_id_from_user(current_user, db)
        if not driver_id:
            raise HTTPException(404, "Driver record not found. Please contact administrator.")
    elif current_user.get("role") in ["admin", "operations_manager", "sales", "client_servicing"]:
        raise HTTPException(400, "Admin/Sales/Client Servicing users should use /driver-dashboard/driver/{id} endpoint")
    else:
        raise HTTPException(403, "Access denied")
    
    try:
        data = await DriverDashboardService.get_driver_dashboard_data(db, driver_id, target_date)
        return data
    except Exception as e:
        raise HTTPException(500, f"Error fetching dashboard: {str(e)}")


@router.get(
    "/profile",
    dependencies=[Depends(require_permission(Permission.DRIVER_DASHBOARD_VIEW))]
)
async def get_my_profile(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get driver's own profile"""
    if current_user.get("role") != "driver":
        raise HTTPException(403, "Only drivers can access this endpoint")
    
    driver_id = await get_driver_id_from_user(current_user, db)
    if not driver_id:
        raise HTTPException(404, "Driver record not found")
    
    try:
        profile = await DriverDashboardService.get_driver_profile(db, driver_id)
        return profile
    except Exception as e:
        raise HTTPException(500, f"Error fetching profile: {str(e)}")


@router.put(
    "/profile",
    dependencies=[Depends(require_permission(Permission.DRIVER_DASHBOARD_VIEW))]
)
async def update_my_profile(
    profile_data: ProfileUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update driver's own profile"""
    if current_user.get("role") != "driver":
        raise HTTPException(403, "Only drivers can update their own profile")
    
    driver_id = await get_driver_id_from_user(current_user, db)
    if not driver_id:
        raise HTTPException(404, "Driver record not found")
    
    try:
        result = await DriverDashboardService.update_driver_profile(
            db, driver_id, profile_data.dict(exclude_unset=True)
        )
        return result
    except Exception as e:
        raise HTTPException(500, f"Error updating profile: {str(e)}")


@router.get(
    "/assigned-work",
    dependencies=[Depends(require_permission(Permission.DRIVER_DASHBOARD_VIEW))]
)
async def get_my_assigned_work(
    target_date: Optional[date] = Query(None, description="Target date (default: today)"),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get driver's assigned work for the day"""
    if current_user.get("role") != "driver":
        raise HTTPException(403, "Only drivers can access this endpoint")
    
    driver_id = await get_driver_id_from_user(current_user, db)
    if not driver_id:
        raise HTTPException(404, "Driver record not found")
    
    if not target_date:
        target_date = date.today()
    
    try:
        assignments = await DriverDashboardService.get_assigned_work(db, driver_id)
        return {"assignments": assignments, "date": str(target_date)}
    except Exception as e:
        raise HTTPException(500, f"Error fetching assignments: {str(e)}")


@router.get(
    "/vehicle",
    dependencies=[Depends(require_permission(Permission.DRIVER_DASHBOARD_VIEW))]
)
async def get_my_vehicle(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get driver's assigned vehicle"""
    if current_user.get("role") != "driver":
        raise HTTPException(403, "Only drivers can access this endpoint")
    
    driver_id = await get_driver_id_from_user(current_user, db)
    if not driver_id:
        raise HTTPException(404, "Driver record not found")
    
    try:
        vehicle = await DriverDashboardService.get_assigned_vehicle(db, driver_id)
        return {"vehicle": vehicle}
    except Exception as e:
        raise HTTPException(500, f"Error fetching vehicle: {str(e)}")


@router.get(
    "/km-log/today",
    dependencies=[Depends(require_permission(Permission.DRIVER_DASHBOARD_VIEW))]
)
async def get_today_km_log(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get today's KM log"""
    if current_user.get("role") != "driver":
        raise HTTPException(403, "Only drivers can access this endpoint")
    
    driver_id = await get_driver_id_from_user(current_user, db)
    if not driver_id:
        raise HTTPException(404, "Driver record not found")
    
    try:
        km_log = await DriverDashboardService.get_today_km_log(db, driver_id, date.today())
        return km_log
    except Exception as e:
        raise HTTPException(500, f"Error fetching KM log: {str(e)}")


@router.post(
    "/km-log/start",
    dependencies=[Depends(require_permission(Permission.DRIVER_DASHBOARD_VIEW))]
)
async def record_start_km(
    km_data: StartKMRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Record start journey with GPS coordinates and base64 photo"""
    if current_user.get("role") != "driver":
        raise HTTPException(403, "Only drivers can record KM")
    
    driver_id = await get_driver_id_from_user(current_user, db)
    if not driver_id:
        raise HTTPException(404, "Driver record not found")
    
    # Convert request to dict for service
    km_dict = km_data.dict()
    
    try:
        result = await DriverDashboardService.record_start_km(db, driver_id, km_dict)
        return result
    except Exception as e:
        raise HTTPException(500, f"Error recording start KM: {str(e)}")


@router.post(
    "/km-log/end",
    dependencies=[Depends(require_permission(Permission.DRIVER_DASHBOARD_VIEW))]
)
async def record_end_km(
    km_data: EndKMRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Record end journey with GPS coordinates and base64 photo"""
    if current_user.get("role") != "driver":
        raise HTTPException(403, "Only drivers can record KM")
    
    driver_id = await get_driver_id_from_user(current_user, db)
    if not driver_id:
        raise HTTPException(404, "Driver record not found")
    
    # Convert request to dict for service
    km_dict = km_data.dict()
    
    try:
        result = await DriverDashboardService.record_end_km(db, driver_id, km_dict)
        return result
    except Exception as e:
        raise HTTPException(500, f"Error recording end KM: {str(e)}")


@router.get(
    "/summary/{target_date}",
    dependencies=[Depends(require_permission(Permission.DRIVER_DASHBOARD_VIEW))]
)
async def get_my_daily_summary(
    target_date: date,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get daily summary for driver"""
    if current_user.get("role") != "driver":
        raise HTTPException(403, "Only drivers can access this endpoint")
    
    driver_id = await get_driver_id_from_user(current_user, db)
    if not driver_id:
        raise HTTPException(404, "Driver record not found")
    
    try:
        summary = await DriverDashboardService.get_daily_summary(db, driver_id, target_date)
        return summary
    except Exception as e:
        raise HTTPException(500, f"Error fetching summary: {str(e)}")


# Admin/Operations Endpoints
@router.get(
    "/driver/{driver_id}",
    dependencies=[Depends(require_permission(Permission.DRIVER_DASHBOARD_VIEW))]
)
async def get_driver_dashboard_admin(
    driver_id: int,
    target_date: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get specific driver's dashboard (Admin/Operations/Sales/Client Servicing)"""
    if current_user.get("role") not in ["admin", "operations_manager", "sales", "client_servicing"]:
        raise HTTPException(403, "Only admin/operations/sales/client_servicing can view drivers' dashboards")
    
    try:
        data = await DriverDashboardService.get_driver_dashboard_data(db, driver_id, target_date)
        return data
    except Exception as e:
        raise HTTPException(500, f"Error fetching driver dashboard: {str(e)}")


@router.get(
    "/all-summary",
    dependencies=[Depends(require_permission(Permission.DRIVER_DASHBOARD_VIEW))]
)
async def get_all_drivers_summary(
    target_date: Optional[date] = Query(None),
    include_inactive: bool = Query(True, description="Include inactive drivers in results"),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get summary for all drivers (Admin/Operations Manager/Sales/Client Servicing)"""
    if current_user.get("role") not in ["admin", "operations_manager", "sales", "client_servicing"]:
        raise HTTPException(403, "Only admin/operations/sales/client_servicing can view all drivers summary")
    
    if not target_date:
        target_date = date.today()
    
    try:
        summaries = await DriverDashboardService.get_all_drivers_summary(
            db, target_date, include_inactive=include_inactive
        )
        return {"date": str(target_date), "data": summaries}
    except Exception as e:
        raise HTTPException(500, f"Error fetching summaries: {str(e)}")
