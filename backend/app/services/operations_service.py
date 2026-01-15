"""
Operations Service
Provides dynamic operations calculations from database
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.campaign import Campaign, CampaignStatus
from app.models.report import Report
from app.models.driver import Driver
from app.models.daily_km_log import DailyKMLog, KMLogStatus
from datetime import date, datetime, timedelta
from typing import Dict, Any, Optional

class OperationsService:
    """Service for operations dashboard calculations"""
    
    async def get_operations_summary(
        self, 
        db: AsyncSession, 
        from_date: Optional[date] = None,
        to_date: Optional[date] = None
    ) -> Dict[str, Any]:
        """
        Get comprehensive operations summary with real-time calculations
        
        Args:
            from_date: Start date for filtering (default: today)
            to_date: End date for filtering (default: today)
        
        Returns:
            - running_campaigns: Count of campaigns with status RUNNING
            - on_hold_campaigns: Count of campaigns with status HOLD
            - completed_today: Count of campaigns completed in date range
            - issues_count: Count of pending/failed operations
            - active_drivers: Count of drivers currently working (IN_PROGRESS km logs)
            - total_reports: Count of reports submitted in date range
            - campaign_status_breakdown: Detailed campaign counts by status
            - from_date: Applied filter start date
            - to_date: Applied filter end date
        """
        today = date.today()
        from_date = from_date or today
        to_date = to_date or today
        
        # Count campaigns by status
        running_query = select(func.count(Campaign.id)).where(
            Campaign.status == CampaignStatus.RUNNING,
            Campaign.is_active == 1
        )
        running_result = await db.execute(running_query)
        running_count = running_result.scalar() or 0
        
        on_hold_query = select(func.count(Campaign.id)).where(
            Campaign.status == CampaignStatus.HOLD,
            Campaign.is_active == 1
        )
        on_hold_result = await db.execute(on_hold_query)
        on_hold_count = on_hold_result.scalar() or 0
        
        # Count campaigns completed in date range
        completed_query = select(func.count(Campaign.id)).where(
            Campaign.status == CampaignStatus.COMPLETED,
            Campaign.is_active == 1,
            func.date(Campaign.updated_at) >= from_date,
            func.date(Campaign.updated_at) <= to_date
        )
        completed_result = await db.execute(completed_query)
        completed_count = completed_result.scalar() or 0
        
        # Count active drivers (with IN_PROGRESS km logs in date range)
        active_drivers_query = select(func.count(func.distinct(DailyKMLog.driver_id))).where(
            DailyKMLog.status == KMLogStatus.IN_PROGRESS,
            DailyKMLog.log_date >= from_date,
            DailyKMLog.log_date <= to_date,
            DailyKMLog.is_active == 1
        )
        active_drivers_result = await db.execute(active_drivers_query)
        active_drivers_count = active_drivers_result.scalar() or 0
        
        # Count reports submitted in date range
        reports_query = select(func.count(Report.id)).where(
            func.date(Report.created_at) >= from_date,
            func.date(Report.created_at) <= to_date,
            Report.is_active == 1
        )
        reports_result = await db.execute(reports_query)
        reports_count = reports_result.scalar() or 0
        
        # Count issues (campaigns with status cancelled or on hold)
        issues_query = select(func.count(Campaign.id)).where(
            Campaign.status.in_([CampaignStatus.CANCELLED, CampaignStatus.HOLD]),
            Campaign.is_active == 1
        )
        issues_result = await db.execute(issues_query)
        issues_count = issues_result.scalar() or 0
        
        # Get detailed campaign status breakdown
        campaign_status_query = select(
            Campaign.status,
            func.count(Campaign.id).label('count')
        ).where(
            Campaign.is_active == 1
        ).group_by(Campaign.status)
        
        campaign_status_result = await db.execute(campaign_status_query)
        campaign_status_rows = campaign_status_result.all()
        
        campaign_status_breakdown = {
            status.value: 0 for status in CampaignStatus
        }
        for row in campaign_status_rows:
            campaign_status_breakdown[row.status.value] = row.count
        
        return {
            "running_campaigns": running_count,
            "on_hold_campaigns": on_hold_count,
            "completed_in_range": completed_count,
            "issues_count": issues_count,
            "active_drivers": active_drivers_count,
            "reports_in_range": reports_count,
            "campaign_status_breakdown": campaign_status_breakdown,
            "from_date": from_date.isoformat(),
            "to_date": to_date.isoformat()
        }
    
    async def get_operations_metrics(self, db: AsyncSession) -> Dict[str, Any]:
        """
        Get quick operations metrics for dashboard cards
        
        Returns minimal set of key metrics
        """
        today = date.today()
        
        # Running campaigns
        running_query = select(func.count(Campaign.id)).where(
            Campaign.status == CampaignStatus.RUNNING,
            Campaign.is_active == 1
        )
        running_result = await db.execute(running_query)
        running_count = running_result.scalar() or 0
        
        # Active drivers today
        active_drivers_query = select(func.count(func.distinct(DailyKMLog.driver_id))).where(
            DailyKMLog.status.in_([KMLogStatus.IN_PROGRESS, KMLogStatus.COMPLETED]),
            DailyKMLog.log_date == today,
            DailyKMLog.is_active == 1
        )
        active_drivers_result = await db.execute(active_drivers_query)
        active_drivers_count = active_drivers_result.scalar() or 0
        
        return {
            "running_campaigns": running_count,
            "active_drivers": active_drivers_count
        }
