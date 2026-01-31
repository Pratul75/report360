from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, cast, Date
from datetime import datetime, date, timedelta
from typing import Dict, List, Optional, Any
import logging

from app.models.driver import Driver
from app.models.driver_profile import DriverProfile
from app.models.driver_assignment import DriverAssignment, AssignmentStatus
from app.models.daily_km_log import DailyKMLog, KMLogStatus
from app.models.vehicle import Vehicle
from app.models.campaign import Campaign
from app.models.project import Project

logger = logging.getLogger(__name__)


class DriverDashboardService:
    """Service for driver dashboard data aggregation and KM tracking"""

    @staticmethod
    async def get_driver_dashboard_data(
        db: AsyncSession,
        driver_id: int,
        target_date: Optional[date] = None,
        include_inactive: bool = False
    ) -> Dict[str, Any]:
        """
        Get complete driver dashboard overview
        Args:
            driver_id: Driver ID
            target_date: Target date for data
            include_inactive: If True, includes inactive drivers (for admin view)
        """
        if not target_date:
            target_date = date.today()
        
        # Get driver basic info
        if include_inactive:
            # For admin view - show all drivers
            driver_query = select(Driver).where(Driver.id == driver_id)
        else:
            # For driver's own view - only active
            driver_query = select(Driver).where(
                and_(Driver.id == driver_id, Driver.is_active == 1)
            )
        
        driver_result = await db.execute(driver_query)
        driver = driver_result.scalar_one_or_none()
        
        if not driver:
            return {"error": "Driver not found"}
        
        # Get profile
        profile = await DriverDashboardService.get_driver_profile(db, driver_id)
        
        # Get assigned work
        assignments = await DriverDashboardService.get_assigned_work(db, driver_id, target_date)
        
        # Get vehicle info
        vehicle_info = await DriverDashboardService.get_assigned_vehicle(db, driver_id)
        
        # Get today's KM log
        km_log = await DriverDashboardService.get_today_km_log(db, driver_id, target_date)
        
        return {
            "driver": {
                "id": driver.id,
                "name": driver.name,
                "phone": driver.phone,
                "email": driver.email,
                "license_number": driver.license_number,
                "license_validity": str(driver.license_validity) if driver.license_validity else None,
            },
            "profile": profile,
            "assignments": assignments,
            "vehicle": vehicle_info,
            "km_log": km_log,
            "date": str(target_date)
        }

    @staticmethod
    async def get_driver_profile(
        db: AsyncSession,
        driver_id: int
    ) -> Dict[str, Any]:
        """Get or create driver profile, including driver name and phone"""
        # Fetch profile and join driver for name/phone
        profile_query = select(DriverProfile, Driver).join(Driver, DriverProfile.driver_id == Driver.id).where(DriverProfile.driver_id == driver_id)
        result = await db.execute(profile_query)
        row = result.first()
        if row:
            profile, driver = row
        else:
            # Create new profile if not exists
            profile = DriverProfile(driver_id=driver_id, is_profile_complete=False)
            db.add(profile)
            await db.commit()
            await db.refresh(profile)
            # Fetch driver for name/phone
            driver = await db.get(Driver, driver_id)
        return {
            "id": profile.id,
            "address": profile.address,
            "emergency_contact_name": profile.emergency_contact_name,
            "emergency_contact_phone": profile.emergency_contact_phone,
            "blood_group": profile.blood_group,
            "profile_photo": profile.profile_photo,
            "aadhar_number": profile.aadhar_number,
            "is_profile_complete": profile.is_profile_complete,
            "driver_name": driver.name if driver else None,
            "driver_phone": driver.phone if driver else None,
        }

    @staticmethod
    async def update_driver_profile(
        db: AsyncSession,
        driver_id: int,
        profile_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update driver profile"""
        profile_query = select(DriverProfile).where(DriverProfile.driver_id == driver_id)
        result = await db.execute(profile_query)
        profile = result.scalar_one_or_none()
        
        if not profile:
            profile = DriverProfile(driver_id=driver_id)
            db.add(profile)
        
        # Update fields
        for key, value in profile_data.items():
            if hasattr(profile, key) and key not in ['id', 'driver_id', 'created_at']:
                setattr(profile, key, value)
        
        # Check if profile is complete
        required_fields = ['address', 'emergency_contact_name', 'emergency_contact_phone']
        profile.is_profile_complete = all(getattr(profile, field) for field in required_fields)
        
        await db.commit()
        await db.refresh(profile)
        
        return {"success": True, "is_complete": profile.is_profile_complete}

    @staticmethod
    async def get_assigned_work(
        db: AsyncSession,
        driver_id: int,
    ) -> List[Dict[str, Any]]:
        """Get driver's assigned work for specific date"""
        assignments_query = select(DriverAssignment).where(
            and_(
                DriverAssignment.driver_id == driver_id,
                DriverAssignment.is_active == 1,
            )
        ).order_by(DriverAssignment.created_at.desc())
        
        result = await db.execute(assignments_query)
        assignments = result.scalars().all()
        
        assignments_list = []
        for assignment in assignments:
            # Get campaign/project details
            campaign_name = None
            project_name = None
            
            if assignment.campaign_id:
                campaign_query = select(Campaign).where(Campaign.id == assignment.campaign_id)
                campaign_result = await db.execute(campaign_query)
                campaign = campaign_result.scalar_one_or_none()
                if campaign:
                    campaign_name = campaign.name
            
            if assignment.project_id:
                project_query = select(Project).where(Project.id == assignment.project_id)
                project_result = await db.execute(project_query)
                project = project_result.scalar_one_or_none()
                if project:
                    project_name = project.name
            
            assignments_list.append({
                "id": assignment.id,
                "campaign_name": campaign_name,
                "campaign_id": assignment.campaign_id,
                "project_id": assignment.project_id,
                "project_name": project_name,
                "task_description": assignment.task_description,
                "assignment_date": str(assignment.assignment_date),
                "status": assignment.status,
                "remarks": assignment.remarks,
            })
        
        return assignments_list

    @staticmethod
    async def get_assigned_vehicle(
        db: AsyncSession,
        driver_id: int
    ) -> Optional[Dict[str, Any]]:
        """Get driver's currently assigned vehicle with full details"""
        driver_query = select(Driver).where(Driver.id == driver_id)
        result = await db.execute(driver_query)
        driver = result.scalar_one_or_none()
        
        if not driver or not driver.vehicle_id:
            return None
        
        # Get vehicle with vendor using join
        from app.models.vendor import Vendor
        vehicle_query = select(Vehicle).where(Vehicle.id == driver.vehicle_id)
        vehicle_result = await db.execute(vehicle_query)
        vehicle = vehicle_result.scalar_one_or_none()
        
        if not vehicle:
            return None
        
        # Get vendor separately if vendor_id exists
        vendor_name = None
        if vehicle.vendor_id:
            vendor_query = select(Vendor).where(Vendor.id == vehicle.vendor_id)
            vendor_result = await db.execute(vendor_query)
            vendor = vendor_result.scalar_one_or_none()
            if vendor:
                vendor_name = vendor.name
        
        return {
            "id": vehicle.id,
            "vehicle_number": vehicle.vehicle_number,
            "vehicle_type": vehicle.vehicle_type,
            "capacity": vehicle.capacity,
            "rc_validity": str(vehicle.rc_validity) if vehicle.rc_validity else None,
            "insurance_validity": str(vehicle.insurance_validity) if vehicle.insurance_validity else None,
            "permit_validity": str(vehicle.permit_validity) if vehicle.permit_validity else None,
            "rc_image": vehicle.rc_image,
            "insurance_image": vehicle.insurance_image,
            "vendor_id": vehicle.vendor_id,
            "vendor_name": vendor_name,
        }

    @staticmethod
    async def get_today_km_log(
        db: AsyncSession,
        driver_id: int,
        target_date: date
    ) -> Dict[str, Any]:
        """Get or create today's KM log - returns most recent if multiple exist"""
        km_log_query = select(DailyKMLog).where(
            and_(
                DailyKMLog.driver_id == driver_id,
                DailyKMLog.log_date == target_date,
                DailyKMLog.is_active == 1
            )
        ).order_by(DailyKMLog.created_at.desc())
        result = await db.execute(km_log_query)
        km_log = result.scalars().first()  # Get most recent entry
        
        if not km_log:
            # Get driver's vehicle
            driver_query = select(Driver).where(Driver.id == driver_id)
            driver_result = await db.execute(driver_query)
            driver = driver_result.scalar_one_or_none()
            
            # Create new log
            km_log = DailyKMLog(
                driver_id=driver_id,
                vehicle_id=driver.vehicle_id if driver else None,
                log_date=target_date,
                status=KMLogStatus.PENDING
            )
            db.add(km_log)
            await db.commit()
            await db.refresh(km_log)
        
        return {
            "id": km_log.id,
            "log_date": str(km_log.log_date),
            "start_km": km_log.start_km,
            "start_km_photo": km_log.start_km_photo,
            "start_latitude": km_log.start_latitude,
            "start_longitude": km_log.start_longitude,
            "start_timestamp": str(km_log.start_timestamp) if km_log.start_timestamp else None,
            "end_km": km_log.end_km,
            "end_km_photo": km_log.end_km_photo,
            "end_latitude": km_log.end_latitude,
            "end_longitude": km_log.end_longitude,
            "end_timestamp": str(km_log.end_timestamp) if km_log.end_timestamp else None,
            "total_km": km_log.total_km,
            "status": km_log.status.value,
            "remarks": km_log.remarks,
            "created_at": str(km_log.created_at) if km_log.created_at else None,
            "updated_at": str(km_log.updated_at) if km_log.updated_at else None,
        }

    @staticmethod
    async def record_start_km(
        db: AsyncSession,
        driver_id: int,
        km_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Record start journey with GPS coordinates and photo (GPS-based tracking)"""
        from app.utils.gps_utils import validate_gps_coordinates
        
        target_date = date.today()
        
        # Validate GPS coordinates (MANDATORY)
        latitude = km_data.get('latitude')
        longitude = km_data.get('longitude')
        
        if latitude is None or longitude is None:
            return {"success": False, "error": "GPS coordinates are required to start journey"}
        
        is_valid, error_msg = validate_gps_coordinates(latitude, longitude)
        if not is_valid:
            return {"success": False, "error": error_msg}
        
        # Get or create KM log
        km_log_query = select(DailyKMLog).where(
            and_(
                DailyKMLog.driver_id == driver_id,
                DailyKMLog.log_date == target_date,
                DailyKMLog.is_active == 1
            )
        )
        result = await db.execute(km_log_query)
        km_log = result.scalar_one_or_none()
        
        if not km_log:
            driver_query = select(Driver).where(Driver.id == driver_id)
            driver_result = await db.execute(driver_query)
            driver = driver_result.scalar_one_or_none()
            
            km_log = DailyKMLog(
                driver_id=driver_id,
                vehicle_id=driver.vehicle_id if driver else None,
                log_date=target_date
            )
            db.add(km_log)
        
        # Update start journey fields (GPS-based)
        km_log.start_latitude = latitude  # PRIMARY: GPS coordinates
        km_log.start_longitude = longitude
        km_log.start_km_photo = km_data.get('start_km_photo')  # Activity proof photo
        km_log.start_timestamp = datetime.now()
        km_log.status = KMLogStatus.IN_PROGRESS
        
        # DEPRECATED: start_km kept for backward compatibility only
        km_log.start_km = None  # Not used in GPS-based tracking
        
        await db.commit()
        await db.refresh(km_log)
        
        return {
            "success": True, 
            "km_log_id": km_log.id, 
            "status": km_log.status.value,
            "start_location": {
                "latitude": km_log.start_latitude,
                "longitude": km_log.start_longitude,
                "timestamp": str(km_log.start_timestamp)
            }
        }

    @staticmethod
    async def record_end_km(
        db: AsyncSession,
        driver_id: int,
        km_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Record end journey with GPS coordinates and auto-calculate distance"""
        from app.utils.gps_utils import validate_gps_coordinates
        
        target_date = date.today()
        
        # Validate GPS coordinates (MANDATORY)
        latitude = km_data.get('latitude')
        longitude = km_data.get('longitude')
        
        if latitude is None or longitude is None:
            return {"success": False, "error": "GPS coordinates are required to end journey"}
        
        is_valid, error_msg = validate_gps_coordinates(latitude, longitude)
        if not is_valid:
            return {"success": False, "error": error_msg}
        
        km_log_query = select(DailyKMLog).where(
            and_(
                DailyKMLog.driver_id == driver_id,
                DailyKMLog.log_date == target_date,
                DailyKMLog.is_active == 1
            )
        )
        result = await db.execute(km_log_query)
        km_log = result.scalar_one_or_none()
        
        if not km_log:
            return {"success": False, "error": "No journey started for today. Please start journey first."}
        
        if not km_log.start_latitude or not km_log.start_longitude:
            return {"success": False, "error": "Start location not recorded. Please start journey first."}
        
        # Validate end timestamp is after start
        if km_log.start_timestamp and datetime.now() < km_log.start_timestamp:
            return {"success": False, "error": "Invalid timestamp: End time cannot be before start time"}
        
        # Update end journey fields (GPS-based)
        km_log.end_latitude = latitude  # PRIMARY: GPS coordinates
        km_log.end_longitude = longitude
        km_log.end_km_photo = km_data.get('end_km_photo')  # Activity proof photo
        km_log.end_timestamp = datetime.now()
        
        # DEPRECATED: end_km kept for backward compatibility only
        km_log.end_km = None  # Not used in GPS-based tracking
        
        # AUTO-CALCULATE total KM from GPS coordinates
        total_km = km_log.calculate_total_km_gps()
        
        await db.commit()
        await db.refresh(km_log)
        
        return {
            "success": True,
            "km_log_id": km_log.id,
            "total_km": km_log.total_km,
            "status": km_log.status.value,
            "journey": {
                "start_location": {
                    "latitude": km_log.start_latitude,
                    "longitude": km_log.start_longitude,
                    "timestamp": str(km_log.start_timestamp)
                },
                "end_location": {
                    "latitude": km_log.end_latitude,
                    "longitude": km_log.end_longitude,
                    "timestamp": str(km_log.end_timestamp)
                },
                "distance_km": km_log.total_km
            }
        }

    @staticmethod
    async def get_daily_summary(
        db: AsyncSession,
        driver_id: int,
        target_date: date
    ) -> Dict[str, Any]:
        """Get daily summary for a driver - simplified version"""
        try:
            # Get driver info
            driver_query = select(Driver).where(Driver.id == driver_id)
            driver_result = await db.execute(driver_query)
            driver = driver_result.scalar_one_or_none()
            
            if not driver:
                return {
                    "driver_id": driver_id,
                    "driver_name": "Unknown Driver",
                    "driver_phone": None,
                    "driver_email": None,
                    "vehicle_number": None,
                    "vehicle_type": None,
                    "km_status": "NOT_STARTED",
                    "total_km": 0,
                    "start_km": None,
                    "end_km": None,
                    "assignments_count": 0,
                    "assignments": [],
                    "date": str(target_date),
                    "is_active": False
                }
            
            # Get vehicle info if assigned
            vehicle_number = None
            vehicle_type = None
            if driver.vehicle_id:
                vehicle_query = select(Vehicle).where(Vehicle.id == driver.vehicle_id)
                vehicle_result = await db.execute(vehicle_query)
                vehicle = vehicle_result.scalar_one_or_none()
                if vehicle:
                    vehicle_number = vehicle.vehicle_number
                    vehicle_type = vehicle.vehicle_type
            
            # Get KM log for this date
            km_log_query = select(DailyKMLog).where(
                and_(
                    DailyKMLog.driver_id == driver_id,
                    DailyKMLog.log_date == target_date,
                    DailyKMLog.is_active == 1
                )
            ).order_by(DailyKMLog.created_at.desc())
            km_result = await db.execute(km_log_query)
            km_log = km_result.scalars().first()
            
            km_status = "NOT_STARTED"
            total_km = 0
            start_km = None
            end_km = None
            
            if km_log:
                km_status = km_log.status.value if hasattr(km_log.status, 'value') else km_log.status
                total_km = km_log.total_km or 0
                start_km = km_log.start_km
                end_km = km_log.end_km
            
            # Get assignments for this date
            assignments_query = select(DriverAssignment).where(
                and_(
                    DriverAssignment.driver_id == driver_id,
                    DriverAssignment.is_active == 1,
                    DriverAssignment.assignment_date == target_date
                )
            )
            assignments_result = await db.execute(assignments_query)
            assignments = assignments_result.scalars().all()
            
            return {
                "driver_id": driver.id,
                "driver_name": driver.name,
                "driver_phone": driver.phone,
                "driver_email": driver.email,
                "vehicle_number": vehicle_number,
                "vehicle_type": vehicle_type,
                "km_status": km_status,
                "total_km": total_km,
                "start_km": start_km,
                "end_km": end_km,
                "assignments_count": len(assignments),
                "assignments": [],
                "date": str(target_date),
                "is_active": bool(driver.is_active)
            }
            
        except Exception as e:
            logger.error(f"Error in get_daily_summary for driver {driver_id}: {str(e)}", exc_info=True)
            # Return minimal data on error
            return {
                "driver_id": driver_id,
                "driver_name": f"Error (ID: {driver_id})",
                "driver_phone": None,
                "driver_email": None,
                "vehicle_number": None,
                "vehicle_type": None,
                "km_status": "NOT_STARTED",
                "total_km": 0,
                "start_km": None,
                "end_km": None,
                "assignments_count": 0,
                "assignments": [],
                "date": str(target_date),
                "error": str(e)
            }

    @staticmethod
    async def get_all_drivers_summary(
        db: AsyncSession,
        target_date: date,
        include_inactive: bool = True
    ) -> List[Dict[str, Any]]:
        """Get summary for drivers with activity on target date only"""
        try:
            # First, find drivers who have activity on this specific date
            # Activity = KM log OR assignment on this date
            
            # Get drivers with KM logs on target_date
            km_log_query = select(DailyKMLog.driver_id).distinct().where(
                and_(
                    DailyKMLog.log_date == target_date,
                    DailyKMLog.is_active == 1
                )
            )
            km_result = await db.execute(km_log_query)
            driver_ids_with_km = set(row[0] for row in km_result.all())
            
            # Get drivers with assignments on target_date
            assignment_query = select(DriverAssignment.driver_id).distinct().where(
                and_(
                    DriverAssignment.assignment_date == target_date,
                    DriverAssignment.is_active == 1
                )
            )
            assign_result = await db.execute(assignment_query)
            driver_ids_with_assignments = set(row[0] for row in assign_result.all())
            
            # Combine both sets to get all active driver IDs for this date
            active_driver_ids = driver_ids_with_km | driver_ids_with_assignments
            
            if not active_driver_ids:
                logger.info(f"No drivers with activity on {target_date}")
                return []
            
            # Now fetch full summary only for these drivers
            summaries = []
            for driver_id in sorted(active_driver_ids):
                try:
                    summary = await DriverDashboardService.get_daily_summary(db, driver_id, target_date)
                    summary["is_active"] = True
                    summaries.append(summary)
                except Exception as e:
                    logger.error(f"Error getting summary for driver {driver_id}: {str(e)}")
                    continue
            
            return summaries
        except Exception as e:
            logger.error(f"Error in get_all_drivers_summary: {str(e)}", exc_info=True)
            return []
