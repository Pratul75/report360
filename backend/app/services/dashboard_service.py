from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.project_repo import ProjectRepository
from app.repositories.campaign_repo import CampaignRepository
from app.repositories.vehicle_repo import VehicleRepository
from app.repositories.expense_repo import ExpenseRepository
from app.repositories.payment_repo import PaymentRepository
from app.schemas.analytics import DashboardStats, CampaignStatusStats

class DashboardService:
    def __init__(self):
        self.project_repo = ProjectRepository()
        self.campaign_repo = CampaignRepository()
        self.vehicle_repo = VehicleRepository()
        self.expense_repo = ExpenseRepository()
    
    async def get_dashboard_stats(self, db: AsyncSession) -> DashboardStats:
        """Get dashboard statistics"""
        
        active_projects = await self.project_repo.count(db, {"status": "active"})
        running_campaigns = await self.campaign_repo.count(db, {"status": "running"})
        vehicles_on_ground = await self.vehicle_repo.count(db, {"is_active": True})
        todays_expense = await self.expense_repo.get_todays_total(db)
        pending_expenses = await self.expense_repo.count(db, {"status": "pending"})
        
        # Get pending payments count from payment repository (DYNAMIC)
        payment_repo = PaymentRepository(db)
        pending_payments = await payment_repo.count_pending()
        
        # Get campaign status counts
        status_counts = await self.campaign_repo.get_status_counts(db)
        campaign_stats = CampaignStatusStats(
            planning=status_counts.get('planning', 0),
            upcoming=status_counts.get('upcoming', 0),
            running=status_counts.get('running', 0),
            hold=status_counts.get('hold', 0),
            completed=status_counts.get('completed', 0),
            cancelled=status_counts.get('cancelled', 0)
        )
        
        return DashboardStats(
            active_projects=active_projects,
            running_campaigns=running_campaigns,
            vehicles_on_ground=vehicles_on_ground,
            todays_expense=todays_expense,
            pending_expenses=pending_expenses,
            pending_payments=pending_payments,
            campaign_stats=campaign_stats
        )
