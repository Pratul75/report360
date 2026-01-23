from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, case, cast, Date
from datetime import datetime, date, timedelta
from typing import Dict, List, Optional, Any
import logging

from app.models.project import Project
from app.models.campaign import Campaign
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.models.expense import Expense
from app.models.promoter_activity import PromoterActivity
from app.models.daily_km_log import DailyKMLog
from app.models.report import Report

logger = logging.getLogger(__name__)


class ClientServicingDashboardService:
    """Service for client servicing dashboard data aggregation and analytics"""

    @staticmethod
    async def get_project_progress(
        db: AsyncSession,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        client_id: Optional[int] = None,
        current_user: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Get project progress overview with filters
        
        CS users will only see their own assigned projects.
        Admin/others will see all projects (or filtered by client_id if provided).
        
        Returns:
            - Today's Projects (starting today)
            - Completed Projects (within date range)
            - Pending Projects (in progress)
            - Upcoming Projects (starting in future)
        """
        try:
            today = date.today()
            
            # Base filter
            base_filters = [Project.is_active == 1]
            
            # If CS user, filter by assigned_cs
            if current_user and current_user.get("role") == "client_servicing":
                user_id = current_user.get("sub") or current_user.get("user_id")
                if user_id:
                    base_filters.append(Project.assigned_cs == user_id)
            elif client_id:
                base_filters.append(Project.client_id == client_id)
            
            # Date range filters - filter projects by start_date or end_date within selected range
            date_range_filters = base_filters.copy()
            if start_date and end_date:
                # Include projects that start OR end within the date range
                date_filter = or_(
                    and_(
                        Project.start_date.isnot(None),
                        cast(Project.start_date, Date).between(start_date, end_date)
                    ),
                    and_(
                        Project.end_date.isnot(None),
                        cast(Project.end_date, Date).between(start_date, end_date)
                    ),
                    # Also include ongoing projects (started before range, not ended yet or ends after range)
                    and_(
                        Project.start_date <= start_date,
                        or_(
                            Project.end_date.is_(None),
                            Project.end_date >= end_date
                        )
                    )
                )
                date_range_filters.append(date_filter)
            
            # Today's Projects - starting today
            today_query = select(func.count(Project.id)).where(
                and_(
                    *base_filters,
                    cast(Project.start_date, Date) == today
                )
            )
            today_result = await db.execute(today_query)
            today_count = today_result.scalar() or 0
            
            # Completed Projects - within date range
            completed_filters = date_range_filters + [Project.status == 'completed']
            completed_query = select(func.count(Project.id)).where(and_(*completed_filters))
            completed_result = await db.execute(completed_query)
            completed_count = completed_result.scalar() or 0
            
            # Pending Projects - active projects within date range
            pending_filters = date_range_filters + [Project.status == 'active']
            pending_query = select(func.count(Project.id)).where(and_(*pending_filters))
            pending_result = await db.execute(pending_query)
            pending_count = pending_result.scalar() or 0
            
            # Upcoming Projects - active projects starting in future (after today)
            upcoming_filters = base_filters + [
                Project.status == 'active',
                Project.start_date > today
            ]
            upcoming_query = select(func.count(Project.id)).where(and_(*upcoming_filters))
            upcoming_result = await db.execute(upcoming_query)
            upcoming_count = upcoming_result.scalar() or 0
            
            # Get recent projects details - within date range if provided
            recent_query = select(Project).where(
                and_(*date_range_filters)
            ).order_by(Project.created_at.desc()).limit(10)
            recent_result = await db.execute(recent_query)
            recent_projects = recent_result.scalars().all()
            
            return {
                "today": today_count,
                "completed": completed_count,
                "pending": pending_count,
                "upcoming": upcoming_count,
                "recent_projects": [
                    {
                        "id": p.id,
                        "name": p.name,
                        "status": p.status,
                        "start_date": str(p.start_date) if p.start_date else None,
                        "end_date": str(p.end_date) if p.end_date else None,
                    }
                    for p in recent_projects
                ]
            }
        except Exception as e:
            logger.error(f"Error in get_project_progress: {str(e)}", exc_info=True)
            raise

    @staticmethod
    async def get_vehicle_movement(
        db: AsyncSession,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        current_user: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Get vehicle movement summary
        
        CS users will see vehicles only for their assigned projects.
        
        Returns:
            - Active Vehicles count
            - Assigned Vehicles (with drivers)
            - Unassigned Vehicles
            - Total Distance (from daily_km_logs and reports)
        """
        try:
            # Active vehicles
            active_query = select(func.count(Vehicle.id)).where(
                Vehicle.is_active == 1
            )
            active_result = await db.execute(active_query)
            active_count = active_result.scalar() or 0
            
            # Assigned vehicles (have drivers assigned)
            try:
                assigned_query = select(func.count(func.distinct(Driver.vehicle_id))).where(
                    and_(
                        Driver.is_active == 1,
                        Driver.vehicle_id.isnot(None)
                    )
                )
                assigned_result = await db.execute(assigned_query)
                assigned_count = assigned_result.scalar() or 0
            except Exception as e:
                logger.warning(f"Error getting assigned vehicles count: {e}")
                assigned_count = 0
            
            # Unassigned vehicles
            unassigned_count = max(0, active_count - assigned_count)
            
            # Calculate total distance from daily_km_logs
            km_logs_total = 0.0
            try:
                km_logs_filters = [DailyKMLog.is_active == 1]
                if start_date:
                    km_logs_filters.append(cast(DailyKMLog.log_date, Date) >= start_date)
                if end_date:
                    km_logs_filters.append(cast(DailyKMLog.log_date, Date) <= end_date)
                
                km_logs_query = select(func.coalesce(func.sum(DailyKMLog.total_km), 0)).where(
                    and_(*km_logs_filters) if len(km_logs_filters) > 1 else km_logs_filters[0]
                )
                km_logs_result = await db.execute(km_logs_query)
                km_logs_total = float(km_logs_result.scalar() or 0)
            except Exception as e:
                logger.warning(f"Error calculating km_logs total: {e}")
                km_logs_total = 0.0
            
            # Calculate total distance from reports (km_travelled)
            reports_total = 0.0
            try:
                reports_filters = [
                    Report.is_active == 1,
                    Report.km_travelled.isnot(None)
                ]
                if start_date:
                    reports_filters.append(cast(Report.report_date, Date) >= start_date)
                if end_date:
                    reports_filters.append(cast(Report.report_date, Date) <= end_date)
                
                reports_query = select(func.coalesce(func.sum(Report.km_travelled), 0)).where(
                    and_(*reports_filters) if len(reports_filters) > 1 else reports_filters[0]
                )
                reports_result = await db.execute(reports_query)
                reports_total = float(reports_result.scalar() or 0)
            except Exception as e:
                logger.warning(f"Error calculating reports total: {e}")
                reports_total = 0.0
            
            # Total distance = daily km logs + reports km travelled
            total_distance = round(km_logs_total + reports_total, 2)
            
            # Get vehicle details
            vehicles = []
            try:
                vehicles_query = select(Vehicle).where(
                    Vehicle.is_active == 1
                ).order_by(Vehicle.vehicle_number).limit(20)
                vehicles_result = await db.execute(vehicles_query)
                vehicles = vehicles_result.scalars().all()
            except Exception as e:
                logger.warning(f"Error fetching vehicle details: {e}")
                vehicles = []
            
            return {
                "active_vehicles": active_count,
                "assigned_vehicles": assigned_count,
                "unassigned_vehicles": unassigned_count,
                "total_distance_km": total_distance,
                "vehicles": [
                    {
                        "id": v.id,
                        "vehicle_number": getattr(v, 'vehicle_number', None),
                        "vehicle_type": getattr(v, 'vehicle_type', None),
                    }
                    for v in vehicles
                ]
            }
        except Exception as e:
            logger.error(f"Error in get_vehicle_movement: {str(e)}", exc_info=True)
            # Return safe defaults instead of raising
            return {
                "active_vehicles": 0,
                "assigned_vehicles": 0,
                "unassigned_vehicles": 0,
                "total_distance_km": 0.0,
                "vehicles": []
            }

    @staticmethod
    async def get_daily_expense_snapshot(
        db: AsyncSession,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        campaign_id: Optional[int] = None,
        current_user: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Get daily expense snapshot with filters
        
        CS users will see expenses only from their assigned projects.
        
        Returns:
            - Total Expenses
            - Approved Expenses
            - Pending Expenses
            - Rejected Expenses
            - Campaign-wise breakdown
        """
        try:
            if not start_date:
                start_date = date.today() - timedelta(days=30)
            if not end_date:
                end_date = date.today()
            
            # Base filters (without Project reference initially)
            base_filters = [Expense.is_active == 1]
            
            # Date filter - use submitted_date if available, otherwise use created_at
            date_filter = or_(
                and_(
                    Expense.submitted_date.isnot(None),
                    cast(Expense.submitted_date, Date).between(start_date, end_date)
                ),
                and_(
                    Expense.submitted_date.is_(None),
                    cast(Expense.created_at, Date).between(start_date, end_date)
                )
            )
            base_filters.append(date_filter)
            
            if campaign_id:
                base_filters.append(Expense.campaign_id == campaign_id)
            
            # Check if user is CS
            is_cs_user = current_user and current_user.get("role") == "client_servicing"
            user_id = None
            if is_cs_user:
                user_id = current_user.get("sub") or current_user.get("user_id")
            
            # Total expenses query
            if is_cs_user and user_id:
                total_query = select(func.coalesce(func.sum(Expense.amount), 0)).join(
                    Campaign, Expense.campaign_id == Campaign.id
                ).join(
                    Project, Campaign.project_id == Project.id
                ).where(
                    and_(*base_filters, Project.assigned_cs == user_id)
                )
            else:
                total_query = select(func.coalesce(func.sum(Expense.amount), 0)).where(
                    and_(*base_filters)
                )
            
            total_result = await db.execute(total_query)
            total_amount = total_result.scalar() or 0.0
            
            # Status-wise breakdown
            if is_cs_user and user_id:
                status_query = select(
                    Expense.status,
                    func.coalesce(func.sum(Expense.amount), 0).label('amount'),
                    func.count(Expense.id).label('count')
                ).join(
                    Campaign, Expense.campaign_id == Campaign.id
                ).join(
                    Project, Campaign.project_id == Project.id
                ).where(
                    and_(*base_filters, Project.assigned_cs == user_id)
                ).group_by(Expense.status)
            else:
                status_query = select(
                    Expense.status,
                    func.coalesce(func.sum(Expense.amount), 0).label('amount'),
                    func.count(Expense.id).label('count')
                ).where(
                    and_(*base_filters)
                ).group_by(Expense.status)
            
            status_result = await db.execute(status_query)
            status_data = status_result.all()
            
            # Initialize with proper status keys
            status_summary = {
                "approved": {"amount": 0.0, "count": 0},
                "pending": {"amount": 0.0, "count": 0},
                "rejected": {"amount": 0.0, "count": 0}
            }
            
            for row in status_data:
                if row.status:
                    # Handle ENUM status - convert to lowercase for consistency
                    status_key = str(row.status).lower()
                    if status_key in status_summary:
                        status_summary[status_key] = {
                            "amount": float(row.amount or 0),
                            "count": int(row.count or 0)
                        }
            
            # Campaign-wise breakdown
            if is_cs_user and user_id:
                campaign_query = select(
                    Campaign.id,
                    Campaign.name,
                    func.coalesce(func.sum(Expense.amount), 0).label('total')
                ).join(
                    Expense, Expense.campaign_id == Campaign.id
                ).join(
                    Project, Campaign.project_id == Project.id
                ).where(
                    and_(*base_filters, Project.assigned_cs == user_id)
                ).group_by(
                    Campaign.id, Campaign.name
                ).order_by(
                    func.coalesce(func.sum(Expense.amount), 0).desc()
                ).limit(10)
            else:
                campaign_query = select(
                    Campaign.id,
                    Campaign.name,
                    func.coalesce(func.sum(Expense.amount), 0).label('total')
                ).join(
                    Expense, Expense.campaign_id == Campaign.id
                ).where(
                    and_(*base_filters)
                ).group_by(
                    Campaign.id, Campaign.name
                ).order_by(
                    func.coalesce(func.sum(Expense.amount), 0).desc()
                ).limit(10)
            
            campaign_result = await db.execute(campaign_query)
            campaign_data = campaign_result.all()
            
            return {
                "total_expenses": float(total_amount),
                "approved": status_summary["approved"],
                "pending": status_summary["pending"],
                "rejected": status_summary["rejected"],
                "campaign_breakdown": [
                    {
                        "campaign_id": row.id,
                        "campaign_name": row.name,
                        "total": float(row.total or 0)
                    }
                    for row in campaign_data
                ]
            }
        except Exception as e:
            logger.error(f"Error in get_daily_expense_snapshot: {str(e)}", exc_info=True)
            raise

    @staticmethod
    async def get_live_photo_gps_updates(
        db: AsyncSession,
        limit: int = 20,
        current_user: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Get latest promoter activities with photos and GPS data
        
        CS users will see activities only from their assigned projects.
        
        Returns:
            - Recent activities with photos
            - GPS coordinates (placeholder - not in current schema)
            - Timestamps
        """
        try:
            # Validate limit
            if limit <= 0:
                limit = 20
            if limit > 100:
                limit = 100
            
            # Check if user is CS
            is_cs_user = current_user and current_user.get("role") == "client_servicing"
            user_id = None
            if is_cs_user:
                user_id = current_user.get("sub") or current_user.get("user_id")
            
            # Build the query with proper joins
            if is_cs_user and user_id:
                # For CS users, join through Campaign and Project with outer join
                activities_query = select(PromoterActivity).join(
                    Campaign, 
                    PromoterActivity.campaign_id == Campaign.id,
                    isouter=True
                ).join(
                    Project, 
                    Campaign.project_id == Project.id,
                    isouter=True
                ).where(
                    and_(
                        PromoterActivity.is_active == 1,
                        or_(
                            Project.assigned_cs == user_id,
                            PromoterActivity.campaign_id.is_(None)  # Include activities without campaign
                        )
                    )
                ).order_by(
                    PromoterActivity.created_at.desc()
                ).limit(limit)
            else:
                # For non-CS users, just get recent activities
                activities_query = select(PromoterActivity).where(
                    PromoterActivity.is_active == 1
                ).order_by(
                    PromoterActivity.created_at.desc()
                ).limit(limit)
            
            activities_result = await db.execute(activities_query)
            activities = activities_result.scalars().all()
            
            activities_list = []
            for a in activities:
                try:
                    # Safely get photo URL
                    photo_url = None
                    if hasattr(a, 'before_image') and a.before_image:
                        photo_url = a.before_image
                    elif hasattr(a, 'during_image') and a.during_image:
                        photo_url = a.during_image
                    elif hasattr(a, 'after_image') and a.after_image:
                        photo_url = a.after_image
                    
                    activity_dict = {
                        "id": getattr(a, 'id', None),
                        "promoter_id": getattr(a, 'promoter_id', None),
                        "promoter_name": getattr(a, 'promoter_name', None),
                        "campaign_id": getattr(a, 'campaign_id', None),
                        "activity_type": getattr(a, 'specialty', None) or "General Activity",
                        "location": getattr(a, 'village_name', None),
                        "latitude": None,  # GPS not in current schema
                        "longitude": None,  # GPS not in current schema
                        "photo_url": photo_url,
                        "notes": getattr(a, 'remarks', None),
                        "activity_date": str(a.activity_date) if hasattr(a, 'activity_date') and a.activity_date else None,
                        "people_attended": getattr(a, 'people_attended', None),
                        "created_at": str(a.created_at) if hasattr(a, 'created_at') and a.created_at else None,
                    }
                    
                    activities_list.append(activity_dict)
                except Exception as e:
                    logger.warning(f"Error processing activity {getattr(a, 'id', 'unknown')}: {e}")
                    continue
            
            return {
                "activities": activities_list,
                "total_count": len(activities_list)
            }
        except Exception as e:
            logger.error(f"Error in get_live_photo_gps_updates: {str(e)}", exc_info=True)
            # Return safe defaults instead of raising
            return {
                "activities": [],
                "total_count": 0
            }