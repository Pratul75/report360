from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select, and_
from datetime import date
from pydantic import BaseModel
from app.database.connection import get_db
from app.services.daily_activity_log_service import DailyActivityLogService
from app.models.driver_assignment import DriverAssignment

router = APIRouter(tags=["Daily Activity Logs"])

# ============ PYDANTIC MODELS ============
class DailyActivityLogRequest(BaseModel):
    driver_assignment_id: int
    driver_id: int
    campaign_id: int = None
    log_date: date = None
    activity_details: str = None
    villages: list = None
    images: list = None
    latitude: float = None
    longitude: float = None
    location_address: str = None
    extra_data: dict = None

# ============ DAILY ACTIVITY LOG ENDPOINTS ============

@router.post("/logs/create", status_code=status.HTTP_201_CREATED)
def create_daily_activity_log(
    request: DailyActivityLogRequest,
    db: Session = Depends(get_db)
):
    """Create a daily activity log for a driver assignment"""
    try:
        service = DailyActivityLogService(db)
        log = service.create_daily_log(
            driver_assignment_id=request.driver_assignment_id,
            driver_id=request.driver_id,
            campaign_id=request.campaign_id,
            log_date=request.log_date,
            activity_details=request.activity_details,
            villages=request.villages,
            images=request.images,
            latitude=request.latitude,
            longitude=request.longitude,
            location_address=request.location_address,
            extra_data=request.extra_data
        )
        return {
            'status': 'success',
            'message': 'Daily activity log created successfully',
            'data': log
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/logs/{log_id}")
def get_daily_activity_log(
    log_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific daily activity log"""
    service = DailyActivityLogService(db)
    log = service.get_daily_log(log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    return log

@router.get("/logs/assignment/{assignment_id}")
def list_logs_for_assignment(
    assignment_id: int,
    db: Session = Depends(get_db)
):
    """List all daily logs for a driver assignment"""
    service = DailyActivityLogService(db)
    logs = service.list_logs_for_assignment(assignment_id)
    return {
        'assignment_id': assignment_id,
        'count': len(logs),
        'logs': logs
    }

@router.get("/logs/date/{log_date}")
def list_logs_for_date(
    log_date: date,
    db: Session = Depends(get_db)
):
    """List all daily logs for a specific date"""
    service = DailyActivityLogService(db)
    logs = service.list_logs_for_date(log_date)
    return {
        'log_date': log_date,
        'count': len(logs),
        'logs': logs
    }

@router.get("/logs/campaign/{campaign_id}/driver/{driver_id}")
def list_logs_for_driver_campaign(
    campaign_id: int,
    driver_id: int,
    db: Session = Depends(get_db)
):
    """List all daily logs for a driver in a specific campaign"""
    service = DailyActivityLogService(db)
    logs = service.list_logs_for_driver_campaign(driver_id, campaign_id)
    return {
        'campaign_id': campaign_id,
        'driver_id': driver_id,
        'count': len(logs),
        'logs': logs
    }

@router.put("/logs/{log_id}")
def update_daily_log(
    log_id: int,
    update_data: dict,
    db: Session = Depends(get_db)
):
    """Update a daily activity log"""
    try:
        service = DailyActivityLogService(db)
        log = service.update_daily_log(log_id, update_data)
        if not log:
            raise HTTPException(status_code=404, detail="Log not found")
        return {'status': 'success', 'message': 'Log updated successfully', 'data': log}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/logs/{log_id}")
def delete_daily_log(
    log_id: int,
    db: Session = Depends(get_db)
):
    """Delete a daily activity log"""
    service = DailyActivityLogService(db)
    success = service.delete_daily_log(log_id)
    if not success:
        raise HTTPException(status_code=404, detail="Log not found")
    return {'status': 'success', 'message': 'Log deleted successfully'}

@router.post("/logs/{log_id}/add-village")
def add_village_to_log(
    log_id: int,
    village_name: str,
    db: Session = Depends(get_db)
):
    """Add a village to an existing daily log"""
    service = DailyActivityLogService(db)
    log = service.add_village_to_log(log_id, village_name)
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    return {'status': 'success', 'message': 'Village added to log', 'data': log}

@router.post("/logs/{log_id}/add-image")
def add_image_to_log(
    log_id: int,
    image_url: str,
    db: Session = Depends(get_db)
):
    """Add an image to an existing daily log"""
    service = DailyActivityLogService(db)
    log = service.add_image_to_log(log_id, image_url)
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    return {'status': 'success', 'message': 'Image added to log', 'data': log}

# ============ ACTIVITY COUNT ENDPOINTS ============

@router.get("/count/assignment/{assignment_id}")
def get_activity_count_for_assignment(
    assignment_id: int,
    db: Session = Depends(get_db)
):
    """Get total activity count for a driver assignment"""
    service = DailyActivityLogService(db)
    count = service.get_activity_count_for_assignment(assignment_id)
    return {
        'assignment_id': assignment_id,
        'total_activities': count
    }

@router.get("/count/campaign/{campaign_id}/driver/{driver_id}")
def get_activity_count_for_driver_in_campaign(
    campaign_id: int,
    driver_id: int,
    db: Session = Depends(get_db)
):
    """Get activity count for a driver in a specific campaign"""
    service = DailyActivityLogService(db)
    count = service.get_activity_count_for_driver_in_campaign(driver_id, campaign_id)
    return {
        'campaign_id': campaign_id,
        'driver_id': driver_id,
        'driver_activities': count
    }

@router.get("/count/date/{activity_date}")
def get_daily_activity_count(
    activity_date: date,
    db: Session = Depends(get_db)
):
    """Get activity count for a specific date"""
    service = DailyActivityLogService(db)
    count = service.get_daily_activity_count(activity_date)
    return {
        'date': activity_date,
        'daily_activities': count
    }

@router.get("/assignments/driver/{driver_id}")
async def list_assignments_for_driver(
    driver_id: int,
    db: Session = Depends(get_db)
):
    """List all active assignments for a driver within campaign duration"""
    from app.models.driver_assignment import AssignmentStatus
    from app.models.campaign import Campaign, CampaignStatus
    from sqlalchemy.orm import joinedload
    from datetime import date
    
    today = date.today()
    
    query = select(DriverAssignment).options(
        joinedload(DriverAssignment.campaign)
    ).where(
        and_(
            DriverAssignment.driver_id == driver_id,
            DriverAssignment.status.in_([AssignmentStatus.ASSIGNED, AssignmentStatus.IN_PROGRESS]),
            # Campaign must be in active status (not COMPLETED, CANCELLED, or HOLD)
            Campaign.status.in_([CampaignStatus.PLANNING, CampaignStatus.UPCOMING, CampaignStatus.RUNNING]),
            # Campaign end_date must be today or later
            Campaign.end_date >= today
        )
    ).join(Campaign)
    result = await db.execute(query)
    assignments = result.scalars().all()
    
    # Format response with campaign details
    formatted_assignments = []
    for assignment in assignments:
        assignment_data = {
            'id': assignment.id,
            'driver_id': assignment.driver_id,
            'campaign_id': assignment.campaign_id,
            'campaign_name': assignment.campaign.name if assignment.campaign else 'N/A',
            'campaign_type': assignment.campaign.campaign_type if assignment.campaign else 'N/A',
            'campaign_description': assignment.campaign.description if assignment.campaign else '',
            'campaign_start_date': str(assignment.campaign.start_date) if assignment.campaign and assignment.campaign.start_date else None,
            'campaign_end_date': str(assignment.campaign.end_date) if assignment.campaign and assignment.campaign.end_date else None,
            'campaign_locations': assignment.campaign.locations if assignment.campaign else '',
            'campaign_budget': assignment.campaign.budget if assignment.campaign else None,
            'work_title': assignment.work_title,
            'work_description': assignment.work_description,
            'village_name': assignment.village_name,
            'location_address': assignment.location_address,
            'status': assignment.status.value if hasattr(assignment.status, 'value') else assignment.status,
            'approval_status': assignment.approval_status,
            'assignment_date': str(assignment.assignment_date),
            'assignment_start_date': str(assignment.assignment_start_date) if assignment.assignment_start_date else None,
            'assignment_end_date': str(assignment.assignment_end_date) if assignment.assignment_end_date else None,
        }
        formatted_assignments.append(assignment_data)
    
    return {
        'driver_id': driver_id,
        'count': len(formatted_assignments),
        'assignments': formatted_assignments
    }

@router.get("/assignments/campaign/{campaign_id}")
async def list_assignments_for_campaign(
    campaign_id: int,
    db: Session = Depends(get_db)
):
    """List all active assignments for a campaign"""
    from app.models.driver_assignment import AssignmentStatus
    from sqlalchemy.orm import joinedload
    
    query = select(DriverAssignment).options(
        joinedload(DriverAssignment.driver),
        joinedload(DriverAssignment.campaign),
        joinedload(DriverAssignment.vehicle)
    ).where(
        and_(
            DriverAssignment.campaign_id == campaign_id,
            DriverAssignment.status.in_([AssignmentStatus.ASSIGNED, AssignmentStatus.IN_PROGRESS])
        )
    )
    result = await db.execute(query)
    assignments = result.scalars().all()
    
    # Format response with driver, vehicle and campaign details
    formatted_assignments = []
    for assignment in assignments:
        assignment_data = {
            'id': assignment.id,
            'driver_id': assignment.driver_id,
            'driver_name': assignment.driver.name if assignment.driver else 'N/A',
            'driver_phone': assignment.driver.phone if assignment.driver else 'N/A',
            'vehicle_id': assignment.vehicle_id,
            'vehicle_number': assignment.vehicle.vehicle_number if assignment.vehicle else 'N/A',
            'vehicle_type': assignment.vehicle.vehicle_type if assignment.vehicle else 'N/A',
            'campaign_id': assignment.campaign_id,
            'campaign_name': assignment.campaign.name if assignment.campaign else 'N/A',
            'work_title': assignment.work_title,
            'work_description': assignment.work_description,
            'village_name': assignment.village_name,
            'location_address': assignment.location_address,
            'status': assignment.status.value if hasattr(assignment.status, 'value') else assignment.status,
            'approval_status': assignment.approval_status,
            'assignment_date': str(assignment.assignment_date),
            'assignment_start_date': str(assignment.assignment_start_date) if assignment.assignment_start_date else None,
            'assignment_end_date': str(assignment.assignment_end_date) if assignment.assignment_end_date else None,
            'assigned_at': str(assignment.created_at) if hasattr(assignment, 'created_at') else str(assignment.assignment_date),
        }
        formatted_assignments.append(assignment_data)
    
    return {
        'campaign_id': campaign_id,
        'count': len(formatted_assignments),
        'assignments': formatted_assignments
    }


