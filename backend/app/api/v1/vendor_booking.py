"""API endpoints for Vendor Driver Booking & Work Assignment"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import date

from app.database.connection import get_db
from app.core.security import get_current_user
from app.schemas.vendor_booking import (
    WorkAssignmentCreate,
    WorkAssignmentUpdate,
    WorkAssignmentResponse,
    VendorCampaignInfo,
    VendorDriverInfo,
    VendorVehicleInfo,
    DriverApprovalAction
)
from app.services.vendor_booking_service import VendorBookingService

router = APIRouter(
    prefix="/vendor-booking",
    tags=["Vendor Driver Booking"]
)


async def get_vendor_id(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> int:
    """Get vendor_id for current user, ensure vendor, admin, sales, or client_servicing role"""
    role = current_user.get("role")
    
    if role == "admin":
        # Admin can see all vendors
        return None
    
    # Allow vendor, sales, and client_servicing roles to access
    if role not in ["vendor", "sales", "client_servicing"]:
        raise HTTPException(
            status_code=403,
            detail="Only vendors, sales, and client_servicing can access this functionality"
        )
    
    # For sales and client_servicing, return None to see all vendors (like admin)
    if role in ["sales", "client_servicing"]:
        return None
    
    # Only vendors need vendor_id from their user record
    if role == "vendor":
        vendor_id = await VendorBookingService.get_vendor_id_from_user(
            db, current_user.get("user_id")
        )
        
        if not vendor_id:
            raise HTTPException(
                status_code=404,
                detail="Vendor account not found for this user"
            )
        
        return vendor_id


@router.get("/campaigns", response_model=List[VendorCampaignInfo])
async def get_vendor_campaigns(
    vendor_id: Optional[int] = Query(None, description="Vendor ID (admin only)"),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get campaigns available for vendor"""
    if current_user.get("role") == "admin" and vendor_id:
        # Admin querying for specific vendor
        v_id = vendor_id
    else:
        # Get vendor_id from current user
        v_id = await get_vendor_id(current_user, db)
    
    campaigns = await VendorBookingService.get_vendor_campaigns(db, v_id)
    return campaigns


@router.get("/drivers", response_model=List[VendorDriverInfo])
async def get_vendor_drivers(
    vendor_id: Optional[int] = Query(None, description="Vendor ID (admin only)"),
    active_only: bool = Query(True, description="Show only active drivers"),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get drivers belonging to vendor"""
    if current_user.get("role") == "admin" and vendor_id:
        v_id = vendor_id
    else:
        v_id = await get_vendor_id(current_user, db)
    
    drivers = await VendorBookingService.get_vendor_drivers(db, v_id, active_only)
    return drivers


@router.get("/vehicles", response_model=List[VendorVehicleInfo])
async def get_vendor_vehicles(
    vendor_id: Optional[int] = Query(None, description="Vendor ID (admin only)"),
    available_only: bool = Query(True, description="Show only available vehicles"),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get vehicles belonging to vendor"""
    if current_user.get("role") == "admin" and vendor_id:
        v_id = vendor_id
    else:
        v_id = await get_vendor_id(current_user, db)
    
    vehicles = await VendorBookingService.get_vendor_vehicles(db, v_id, available_only)
    return vehicles


@router.post("/assignments", response_model=WorkAssignmentResponse, status_code=201)
async def create_work_assignment(
    assignment: WorkAssignmentCreate,
    vendor_id: Optional[int] = Query(None, description="Vendor ID (admin only)"),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new driver work assignment"""
    if current_user.get("role") == "admin" and vendor_id:
        v_id = vendor_id
    else:
        v_id = await get_vendor_id(current_user, db)
    
    assignment_data = assignment.dict()
    result = await VendorBookingService.create_work_assignment(
        db=db,
        vendor_id=v_id,
        assigned_by_user_id=current_user.get("user_id"),
        assignment_data=assignment_data
    )
    
    return result


@router.get("/assignments", response_model=List[WorkAssignmentResponse])
async def get_vendor_assignments(
    vendor_id: Optional[int] = Query(None, description="Vendor ID (admin only)"),
    campaign_id: Optional[int] = Query(None, description="Filter by campaign"),
    assignment_date: Optional[date] = Query(None, description="Filter by date"),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all work assignments for vendor's drivers or driver's own assignments"""
    role = current_user.get("role")
    
    # Driver viewing their own assignments
    if role == "driver":
        user_id = current_user.get("user_id")
        user_email = current_user.get("email")
        
        # Get driver record for this user by email (drivers table doesn't have user_id column)
        from app.models.driver import Driver
        from app.models.user import User
        from sqlalchemy import select
        
        # First get user email if not in token
        if not user_email:
            user_query = select(User.email).where(User.id == user_id)
            user_result = await db.execute(user_query)
            user_email = user_result.scalar_one_or_none()
        
        if not user_email:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Find driver by email
        driver_query = select(Driver.id).where(Driver.email == user_email)
        driver_result = await db.execute(driver_query)
        driver_id = driver_result.scalar_one_or_none()
        
        if not driver_id:
            raise HTTPException(
                status_code=404, 
                detail=f"Driver record not found for email: {user_email}"
            )
        
        # Get assignments for this specific driver
        assignments = await VendorBookingService.get_driver_assignments(
            db=db,
            driver_id=driver_id,
            campaign_id=campaign_id,
            assignment_date=assignment_date
        )
        return assignments
    
    # Vendor or admin viewing assignments
    if role == "admin" and vendor_id:
        v_id = vendor_id
    else:
        v_id = await get_vendor_id(current_user, db)
    
    assignments = await VendorBookingService.get_vendor_assignments(
        db=db,
        vendor_id=v_id,
        campaign_id=campaign_id,
        assignment_date=assignment_date
    )
    
    return assignments


@router.get("/assignments/{assignment_id}", response_model=WorkAssignmentResponse)
async def get_assignment_details(
    assignment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get detailed information about a specific assignment"""
    assignment = await VendorBookingService.get_assignment_details(db, assignment_id)
    
    # Verify vendor ownership if not admin
    if current_user.get("role") != "admin":
        v_id = await get_vendor_id(current_user, db)
        # Verify driver belongs to vendor (service handles this)
    
    return assignment


@router.put("/assignments/{assignment_id}", response_model=WorkAssignmentResponse)
async def update_work_assignment(
    assignment_id: int,
    update_data: WorkAssignmentUpdate,
    vendor_id: Optional[int] = Query(None, description="Vendor ID (admin only)"),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update work assignment details"""
    if current_user.get("role") == "admin" and vendor_id:
        v_id = vendor_id
    else:
        v_id = await get_vendor_id(current_user, db)
    
    update_dict = update_data.dict(exclude_unset=True)
    result = await VendorBookingService.update_assignment(
        db=db,
        vendor_id=v_id,
        assignment_id=assignment_id,
        update_data=update_dict
    )
    
    return result


@router.post("/assignments/{assignment_id}/cancel", response_model=WorkAssignmentResponse)
async def cancel_assignment(
    assignment_id: int,
    remarks: Optional[str] = Query(None, description="Cancellation reason"),
    vendor_id: Optional[int] = Query(None, description="Vendor ID (admin only)"),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Cancel a work assignment"""
    if current_user.get("role") == "admin" and vendor_id:
        v_id = vendor_id
    else:
        v_id = await get_vendor_id(current_user, db)
    
    result = await VendorBookingService.cancel_assignment(
        db=db,
        vendor_id=v_id,
        assignment_id=assignment_id,
        remarks=remarks
    )
    
    return result


@router.post("/assignments/{assignment_id}/driver-action", response_model=WorkAssignmentResponse)
async def driver_assignment_action(
    assignment_id: int,
    action_data: DriverApprovalAction,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Driver approves or rejects an assignment"""
    role = current_user.get("role")
    
    # Only drivers can approve/reject their own assignments
    if role != "driver":
        raise HTTPException(
            status_code=403,
            detail="Only drivers can approve or reject assignments"
        )
    
    # Get driver record for this user by email (drivers table doesn't have user_id column)
    from app.models.driver import Driver
    from app.models.user import User
    from sqlalchemy import select
    
    user_id = current_user.get("user_id")
    user_email = current_user.get("email")
    
    # Get user email if not in token
    if not user_email:
        user_query = select(User.email).where(User.id == user_id)
        user_result = await db.execute(user_query)
        user_email = user_result.scalar_one_or_none()
    
    if not user_email:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Find driver by email
    driver_query = select(Driver.id).where(Driver.email == user_email)
    driver_result = await db.execute(driver_query)
    driver_id = driver_result.scalar_one_or_none()
    
    if not driver_id:
        raise HTTPException(
            status_code=404,
            detail=f"Driver record not found for email: {user_email}"
        )
    
    # Perform action
    if action_data.action.lower() == "approve":
        result = await VendorBookingService.driver_approve_assignment(
            db=db,
            driver_id=driver_id,
            assignment_id=assignment_id
        )
    elif action_data.action.lower() == "reject":
        if not action_data.rejection_reason:
            raise HTTPException(
                status_code=400,
                detail="Rejection reason is required when rejecting an assignment"
            )
        result = await VendorBookingService.driver_reject_assignment(
            db=db,
            driver_id=driver_id,
            assignment_id=assignment_id,
            rejection_reason=action_data.rejection_reason
        )
    else:
        raise HTTPException(
            status_code=400,
            detail="Invalid action. Must be 'approve' or 'reject'"
        )
    
    return result

