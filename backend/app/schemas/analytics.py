from pydantic import BaseModel
from typing import Optional

class CampaignStatusStats(BaseModel):
    planning: int = 0
    upcoming: int = 0
    running: int = 0
    hold: int = 0
    completed: int = 0
    cancelled: int = 0

class DashboardStats(BaseModel):
    active_projects: int
    running_campaigns: int
    vehicles_on_ground: int
    todays_expense: float
    pending_expenses: int
    pending_payments: int
    campaign_stats: Optional[CampaignStatusStats] = None

class AnalyticsMetrics(BaseModel):
    total_campaigns: int
    total_expenses: float
    avg_campaign_cost: float
    vehicle_utilization: float
    driver_performance_avg: float
