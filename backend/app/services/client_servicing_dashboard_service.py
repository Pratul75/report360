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
        client_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Get project progress overview with filters
        
        Returns:
            - Today's Projects (starting today)
            - Completed Projects (within date range)
            - Pending Projects (in progress)
            - Upcoming Projects (starting in future)
        """
        today = date.today()
        
        # Base filter
        base_filters = [Project.is_active == 1]
        if client_id:
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
        upcoming_filters = date_range_filters + [
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

    @staticmethod
    async def get_vehicle_movement(
        db: AsyncSession,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Dict[str, Any]:
        """
        Get vehicle movement summary
        
        Returns:
            - Active Vehicles count
            - Assigned Vehicles (with drivers)
            - Unassigned Vehicles
            - Total Distance (from daily_km_logs and reports)
        """
        # Active vehicles (vehicles table doesn't have status column)
        active_query = select(func.count(Vehicle.id)).where(
            Vehicle.is_active == 1
        )
        active_result = await db.execute(active_query)
        active_count = active_result.scalar() or 0
        
        # Assigned vehicles (have drivers assigned)
        assigned_query = select(func.count(func.distinct(Driver.vehicle_id))).where(
            and_(
                Driver.is_active == 1,
                Driver.vehicle_id.isnot(None)
            )
        )
        assigned_result = await db.execute(assigned_query)
        assigned_count = assigned_result.scalar() or 0
        
        # Unassigned vehicles
        unassigned_count = active_count - assigned_count
        
        # Calculate total distance from daily_km_logs
        km_logs_query = select(func.coalesce(func.sum(DailyKMLog.total_km), 0)).where(
            DailyKMLog.is_active == 1
        )
        if start_date:
            km_logs_query = km_logs_query.where(DailyKMLog.log_date >= start_date)
        if end_date:
            km_logs_query = km_logs_query.where(DailyKMLog.log_date <= end_date)
        
        km_logs_result = await db.execute(km_logs_query)
        km_logs_total = km_logs_result.scalar() or 0
        
        # Calculate total distance from reports (km_travelled)
        reports_query = select(func.coalesce(func.sum(Report.km_travelled), 0)).where(
            and_(
                Report.is_active == 1,
                Report.km_travelled.isnot(None)
            )
        )
        if start_date:
            reports_query = reports_query.where(Report.report_date >= start_date)
        if end_date:
            reports_query = reports_query.where(Report.report_date <= end_date)
        
        reports_result = await db.execute(reports_query)
        reports_total = reports_result.scalar() or 0
        
        # Total distance = daily km logs + reports km travelled
        total_distance = round(km_logs_total + reports_total, 2)
        
        # Get vehicle details
        vehicles_query = select(Vehicle).where(
            Vehicle.is_active == 1
        ).order_by(Vehicle.vehicle_number)
        vehicles_result = await db.execute(vehicles_query)
        vehicles = vehicles_result.scalars().all()
        
        return {
            "active_vehicles": active_count,
            "assigned_vehicles": assigned_count,
            "unassigned_vehicles": max(0, unassigned_count),
            "total_distance_km": total_distance,
            "vehicles": [
                {
                    "id": v.id,
                    "vehicle_number": v.vehicle_number,
                    "vehicle_type": v.vehicle_type,
                }
                for v in vehicles[:20]  # Limit to 20
            ]
        }

    @staticmethod
    async def get_daily_expense_snapshot(
        db: AsyncSession,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        campaign_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Get daily expense snapshot with filters
        
        Returns:
            - Total Expenses
            - Approved Expenses
            - Pending Expenses
            - Rejected Expenses
            - Campaign-wise breakdown
        """
        if not start_date:
            start_date = date.today() - timedelta(days=30)
        if not end_date:
            end_date = date.today()
        
        # Base filters - use submitted_date or created_at for filtering
        base_filters = [Expense.is_active == 1]
        
        # Use submitted_date if available, otherwise use created_at
        if start_date and end_date:
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
        
        # Total expenses
        total_query = select(func.sum(Expense.amount)).where(and_(*base_filters))
        total_result = await db.execute(total_query)
        total_amount = total_result.scalar() or 0.0
        
        # Status-wise breakdown
        status_query = select(
            Expense.status,
            func.sum(Expense.amount).label('amount'),
            func.count(Expense.id).label('count')
        ).where(
            and_(*base_filters)
        ).group_by(Expense.status)
        
        status_result = await db.execute(status_query)
        status_data = status_result.all()
        
        status_summary = {
            "approved": {"amount": 0.0, "count": 0},
            "pending": {"amount": 0.0, "count": 0},
            "rejected": {"amount": 0.0, "count": 0}
        }
        
        for row in status_data:
            status = (row.status or 'PENDING').lower()  # Convert ENUM to lowercase
            status_summary[status] = {
                "amount": float(row.amount or 0),
                "count": row.count
            }
        
        # Campaign-wise breakdown
        campaign_query = select(
            Campaign.id,
            Campaign.name,
            func.sum(Expense.amount).label('total')
        ).join(
            Expense, Expense.campaign_id == Campaign.id
        ).where(
            and_(*base_filters)
        ).group_by(Campaign.id, Campaign.name).order_by(func.sum(Expense.amount).desc()).limit(10)
        
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
                    "total": float(row.total)
                }
                for row in campaign_data
            ]
        }

    @staticmethod
    async def get_live_photo_gps_updates(
        db: AsyncSession,
        limit: int = 20
    ) -> Dict[str, Any]:
        """
        Get latest promoter activities with photos and GPS data
        
        Returns:
            - Recent activities with photos
            - GPS coordinates (placeholder - not in current schema)
            - Timestamps
        """
        # Get recent promoter activities
        activities_query = select(PromoterActivity).where(
            PromoterActivity.is_active == 1
        ).order_by(PromoterActivity.created_at.desc()).limit(limit)
        
        activities_result = await db.execute(activities_query)
        activities = activities_result.scalars().all()
        
        return {
            "activities": [
                {
                    "id": a.id,
                    "promoter_id": a.promoter_id,
                    "promoter_name": a.promoter_name,
                    "campaign_id": a.campaign_id,
                    "activity_type": a.specialty or "General Activity",
                    "location": a.village_name,
                    "latitude": None,  # GPS not in current schema
                    "longitude": None,  # GPS not in current schema
                    "photo_url": a.before_image or a.during_image or a.after_image,
                    "notes": a.remarks,
                    "activity_date": str(a.activity_date) if a.activity_date else None,
                    "people_attended": a.people_attended,
                    "created_at": str(a.created_at) if a.created_at else None,
                }
                for a in activities
            ],
            "total_count": len(activities)
        }
