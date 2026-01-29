"""Service for Vendor Driver Booking & Work Assignment"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from datetime import date, datetime
from typing import List, Dict, Any, Optional
import logging

from app.models.driver_assignment import DriverAssignment, AssignmentStatus
from app.models.driver import Driver
from app.models.vehicle import Vehicle
from app.models.campaign import Campaign
from app.models.project import Project
from app.models.vendor import Vendor
from app.models.user import User
from fastapi import HTTPException

logger = logging.getLogger(__name__)


class VendorBookingService:
    """Service for vendor-scoped driver booking and work assignment"""
    
    @staticmethod
    async def get_vendor_id_from_user(db: AsyncSession, user_id: int) -> Optional[int]:
        """Get vendor_id associated with a user account"""
        # Users table has vendor_id column that directly links to vendors table
        user_query = select(User).where(User.id == user_id)
        result = await db.execute(user_query)
        user = result.scalar_one_or_none()
        
        if not user:
            logger.warning(f"User not found: user_id={user_id}")
            return None
        
        # Return vendor_id directly from user record
        if hasattr(user, 'vendor_id') and user.vendor_id:
            logger.info(f"Found vendor_id={user.vendor_id} for user_id={user_id}")
            return user.vendor_id
        
        logger.warning(f"User {user_id} has no vendor_id assigned")
        return None
    
    @staticmethod
    async def get_vendor_campaigns(
        db: AsyncSession,
        vendor_id: int
    ) -> List[Dict[str, Any]]:
        """Get campaigns assigned to vendor (via campaign_vehicles or other relationship)"""
        # Note: You may need to adjust this query based on how campaigns are assigned to vendors
        # Option 1: Via vehicles assigned to campaign
        # Option 2: Via a campaign_vendors junction table
        # For now, we'll get all campaigns (admin can see all, vendor sees assigned ones)
        
        query = select(Campaign).where(Campaign.is_active == 1)
        result = await db.execute(query)
        campaigns = result.scalars().all()
        
        campaign_list = []
        for campaign in campaigns:
            project_name = None
            if campaign.project_id:
                project_query = select(Project).where(Project.id == campaign.project_id)
                project_result = await db.execute(project_query)
                project = project_result.scalar_one_or_none()
                if project:
                    project_name = project.name
            
            campaign_list.append({
                "id": campaign.id,
                "name": campaign.name,
                "campaign_type": campaign.campaign_type.value if campaign.campaign_type else None,
                "status": campaign.status.value if campaign.status else None,
                "start_date": campaign.start_date,
                "end_date": campaign.end_date,
                "locations": campaign.locations,
                "project_id": campaign.project_id,
                "project_name": project_name
            })
        
        return campaign_list
    
    @staticmethod
    async def get_vendor_drivers(
        db: AsyncSession,
        vendor_id: Optional[int],
        active_only: bool = True
    ) -> List[Dict[str, Any]]:
        """Get drivers belonging to vendor (or all drivers if vendor_id is None for admin)"""
        query = select(Driver)
        
        if vendor_id is not None:
            query = query.where(Driver.vendor_id == vendor_id)
        
        if active_only:
            query = query.where(Driver.is_active == 1)
        
        result = await db.execute(query)
        drivers = result.scalars().all()
        
        return [{
            "id": driver.id,
            "name": driver.name,
            "phone": driver.phone,
            "email": driver.email,
            "license_number": driver.license_number,
            "is_active": bool(driver.is_active)
        } for driver in drivers]
    
    @staticmethod
    async def get_vendor_vehicles(
        db: AsyncSession,
        vendor_id: Optional[int],
        available_only: bool = True
    ) -> List[Dict[str, Any]]:
        """Get vehicles belonging to vendor (or all vehicles if vendor_id is None for admin)"""
        query = select(Vehicle)
        
        if vendor_id is not None:
            query = query.where(Vehicle.vendor_id == vendor_id)
        
        if available_only:
            query = query.where(Vehicle.is_active == 1)
        
        result = await db.execute(query)
        vehicles = result.scalars().all()
        
        return [{
            "id": vehicle.id,
            "vehicle_number": vehicle.vehicle_number,
            "vehicle_type": vehicle.vehicle_type,
            "is_available": bool(vehicle.is_active)
        } for vehicle in vehicles]
    
    @staticmethod
    async def create_work_assignment(
        db: AsyncSession,
        vendor_id: int,
        assigned_by_user_id: int,
        assignment_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create a new work assignment with vendor scoping"""
        
        # Validate driver belongs to vendor
        driver_query = select(Driver).where(
            and_(
                Driver.id == assignment_data["driver_id"],
                Driver.vendor_id == vendor_id
            )
        )
        driver_result = await db.execute(driver_query)
        driver = driver_result.scalar_one_or_none()
        
        if not driver:
            raise HTTPException(
                status_code=403,
                detail="Driver does not belong to your vendor account"
            )
        
        # Validate vehicle belongs to vendor
        vehicle_query = select(Vehicle).where(
            and_(
                Vehicle.id == assignment_data["vehicle_id"],
                Vehicle.vendor_id == vendor_id
            )
        )
        vehicle_result = await db.execute(vehicle_query)
        vehicle = vehicle_result.scalar_one_or_none()
        
        if not vehicle:
            raise HTTPException(
                status_code=403,
                detail="Vehicle does not belong to your vendor account"
            )
        
        # Validate campaign exists
        campaign_query = select(Campaign).where(Campaign.id == assignment_data["campaign_id"])
        campaign_result = await db.execute(campaign_query)
        campaign = campaign_result.scalar_one_or_none()
        
        if not campaign:
            raise HTTPException(
                status_code=404,
                detail="Campaign not found"
            )
        
        # Create assignment
        assignment = DriverAssignment(
            driver_id=assignment_data["driver_id"],
            campaign_id=assignment_data["campaign_id"],
            vehicle_id=assignment_data["vehicle_id"],
            assignment_date=assignment_data["assignment_date"],
            work_title=assignment_data.get("work_title"),
            work_description=assignment_data.get("work_description"),
            village_name=assignment_data.get("village_name"),
            location_address=assignment_data.get("location_address"),
            expected_start_time=assignment_data.get("expected_start_time"),
            expected_end_time=assignment_data.get("expected_end_time"),
            remarks=assignment_data.get("remarks"),
            status=AssignmentStatus.ASSIGNED,
            assigned_by_id=assigned_by_user_id,
            is_active=1
        )
        
        db.add(assignment)
        await db.commit()
        await db.refresh(assignment)
        
        logger.info(f"Work assignment created: ID={assignment.id} by vendor={vendor_id}")
        
        return await VendorBookingService.get_assignment_details(db, assignment.id)
    
    @staticmethod
    async def get_assignment_details(
        db: AsyncSession,
        assignment_id: int
    ) -> Dict[str, Any]:
        """Get detailed assignment information"""
        query = select(DriverAssignment).where(DriverAssignment.id == assignment_id)
        result = await db.execute(query)
        assignment = result.scalar_one_or_none()
        
        if not assignment:
            raise HTTPException(status_code=404, detail="Assignment not found")
        
        # Get related data
        driver = await db.get(Driver, assignment.driver_id)
        vehicle = await db.get(Vehicle, assignment.vehicle_id) if assignment.vehicle_id else None
        campaign = await db.get(Campaign, assignment.campaign_id) if assignment.campaign_id else None
        assigned_by = await db.get(User, assignment.assigned_by_id) if assignment.assigned_by_id else None
        
        return {
            "id": assignment.id,
            "campaign_id": assignment.campaign_id,
            "campaign_name": campaign.name if campaign else None,
            "driver_id": assignment.driver_id,
            "driver_name": driver.name if driver else "Unknown",
            "vehicle_id": assignment.vehicle_id,
            "vehicle_number": vehicle.vehicle_number if vehicle else None,
            "assignment_date": assignment.assignment_date,
            "work_title": assignment.work_title,
            "work_description": assignment.work_description,
            "village_name": assignment.village_name,
            "location_address": assignment.location_address,
            "expected_start_time": assignment.expected_start_time,
            "expected_end_time": assignment.expected_end_time,
            "actual_start_time": assignment.actual_start_time,
            "actual_end_time": assignment.actual_end_time,
            "status": assignment.status.value if assignment.status else "ASSIGNED",
            "assigned_by_id": assignment.assigned_by_id,
            "assigned_by_name": assigned_by.email if assigned_by else None,
            "completed_at": assignment.completed_at,
            "remarks": assignment.remarks,
            "approval_status": assignment.approval_status.value if hasattr(assignment, 'approval_status') and assignment.approval_status else "PENDING_APPROVAL",
            "approved_at": assignment.approved_at if hasattr(assignment, 'approved_at') else None,
            "rejected_at": assignment.rejected_at if hasattr(assignment, 'rejected_at') else None,
            "rejection_reason": assignment.rejection_reason if hasattr(assignment, 'rejection_reason') else None,
            "created_at": assignment.created_at,
            "updated_at": assignment.updated_at
        }
    
    @staticmethod
    async def get_vendor_assignments(
        db: AsyncSession,
        vendor_id: int,
        campaign_id: Optional[int] = None,
        assignment_date: Optional[date] = None
    ) -> List[Dict[str, Any]]:
        """Get all assignments for vendor's drivers (or all if vendor_id is None)"""
        # If vendor_id is None (admin/sales/client_servicing), get all drivers
        if vendor_id is None:
            driver_query = select(Driver.id).where(Driver.is_active == 1)
        else:
            # Get vendor's drivers only
            driver_query = select(Driver.id).where(
                and_(
                    Driver.vendor_id == vendor_id,
                    Driver.is_active == 1
                )
            )
        
        driver_result = await db.execute(driver_query)
        driver_ids = [row[0] for row in driver_result.fetchall()]
        
        if not driver_ids:
            return []
        
        # Query assignments
        query = select(DriverAssignment).where(
            and_(
                DriverAssignment.driver_id.in_(driver_ids),
                DriverAssignment.is_active == 1
            )
        )
        
        if campaign_id:
            query = query.where(DriverAssignment.campaign_id == campaign_id)
        
        if assignment_date:
            query = query.where(DriverAssignment.assignment_date == assignment_date)
        
        query = query.order_by(DriverAssignment.assignment_date.desc())
        
        result = await db.execute(query)
        assignments = result.scalars().all()
        
        # Get details for each assignment
        assignment_details = []
        for assignment in assignments:
            details = await VendorBookingService.get_assignment_details(db, assignment.id)
            assignment_details.append(details)
        
        return assignment_details
    
    @staticmethod
    async def get_driver_assignments(
        db: AsyncSession,
        driver_id: int,
        campaign_id: Optional[int] = None,
        assignment_date: Optional[date] = None
    ) -> List[Dict[str, Any]]:
        """Get all assignments for a specific driver"""
        query = select(DriverAssignment).where(
            and_(
                DriverAssignment.driver_id == driver_id,
                DriverAssignment.is_active == 1
            )
        )
        
        if campaign_id:
            query = query.where(DriverAssignment.campaign_id == campaign_id)
        
        if assignment_date:
            query = query.where(DriverAssignment.assignment_date == assignment_date)
        
        query = query.order_by(DriverAssignment.assignment_date.desc())
        
        result = await db.execute(query)
        assignments = result.scalars().all()
        
        # Get details for each assignment
        assignment_details = []
        for assignment in assignments:
            details = await VendorBookingService.get_assignment_details(db, assignment.id)
            assignment_details.append(details)
        
        return assignment_details
        
        result = await db.execute(query)
        assignments = result.scalars().all()
        
        # Build response with related data
        assignment_list = []
        for assignment in assignments:
            assignment_data = await VendorBookingService.get_assignment_details(db, assignment.id)
            assignment_list.append(assignment_data)
        
        return assignment_list
    
    @staticmethod
    async def update_assignment(
        db: AsyncSession,
        vendor_id: int,
        assignment_id: int,
        update_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update work assignment (vendor-scoped)"""
        # Get assignment and validate vendor ownership
        query = select(DriverAssignment).where(DriverAssignment.id == assignment_id)
        result = await db.execute(query)
        assignment = result.scalar_one_or_none()
        
        if not assignment:
            raise HTTPException(status_code=404, detail="Assignment not found")
        
        # Verify driver belongs to vendor
        driver = await db.get(Driver, assignment.driver_id)
        if not driver or driver.vendor_id != vendor_id:
            raise HTTPException(
                status_code=403,
                detail="You don't have permission to modify this assignment"
            )
        
        # Update fields
        for key, value in update_data.items():
            if value is not None and hasattr(assignment, key):
                setattr(assignment, key, value)
        
        assignment.updated_at = datetime.now()
        await db.commit()
        await db.refresh(assignment)
        
        return await VendorBookingService.get_assignment_details(db, assignment.id)
    
    @staticmethod
    async def cancel_assignment(
        db: AsyncSession,
        vendor_id: int,
        assignment_id: int,
        remarks: Optional[str] = None
    ) -> Dict[str, Any]:
        """Cancel an assignment"""
        update_data = {
            "status": AssignmentStatus.CANCELLED,
            "remarks": remarks
        }
        return await VendorBookingService.update_assignment(db, vendor_id, assignment_id, update_data)
    
    @staticmethod
    async def driver_approve_assignment(
        db: AsyncSession,
        driver_id: int,
        assignment_id: int
    ) -> Dict[str, Any]:
        """Driver approves an assignment"""
        from app.models.driver_assignment import ApprovalStatus
        
        query = select(DriverAssignment).where(
            and_(
                DriverAssignment.id == assignment_id,
                DriverAssignment.driver_id == driver_id
            )
        )
        result = await db.execute(query)
        assignment = result.scalar_one_or_none()
        
        if not assignment:
            raise HTTPException(
                status_code=404, 
                detail="Assignment not found or you don't have permission"
            )
        
        # Update approval status
        assignment.approval_status = ApprovalStatus.APPROVED
        assignment.approved_at = datetime.now()
        assignment.rejected_at = None
        assignment.rejection_reason = None
        assignment.updated_at = datetime.now()
        
        await db.commit()
        await db.refresh(assignment)
        
        logger.info(f"Assignment {assignment_id} approved by driver {driver_id}")
        return await VendorBookingService.get_assignment_details(db, assignment.id)
    
    @staticmethod
    async def driver_reject_assignment(
        db: AsyncSession,
        driver_id: int,
        assignment_id: int,
        rejection_reason: Optional[str] = None
    ) -> Dict[str, Any]:
        """Driver rejects an assignment"""
        from app.models.driver_assignment import ApprovalStatus
        
        query = select(DriverAssignment).where(
            and_(
                DriverAssignment.id == assignment_id,
                DriverAssignment.driver_id == driver_id
            )
        )
        result = await db.execute(query)
        assignment = result.scalar_one_or_none()
        
        if not assignment:
            raise HTTPException(
                status_code=404, 
                detail="Assignment not found or you don't have permission"
            )
        
        # Update approval status
        assignment.approval_status = ApprovalStatus.REJECTED
        assignment.rejected_at = datetime.now()
        assignment.rejection_reason = rejection_reason
        assignment.approved_at = None
        assignment.updated_at = datetime.now()
        
        await db.commit()
        await db.refresh(assignment)
        
        logger.info(f"Assignment {assignment_id} rejected by driver {driver_id}: {rejection_reason}")
        return await VendorBookingService.get_assignment_details(db, assignment.id)

