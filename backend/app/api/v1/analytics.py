from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, cast, Date
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any

from app.database.connection import get_db
from app.models.campaign import Campaign, CampaignStatus
from app.models.expense import Expense, ExpenseStatus
from app.models.invoice import Invoice, InvoiceStatus
from app.models.vendor import Vendor
from app.models.driver import Driver
from app.models.vehicle import Vehicle
from app.api.dependencies import require_permission
from app.core.role_permissions import Permission

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/campaign-status")
async def get_campaign_status_distribution(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.ANALYTICS_VIEW))
):
    """
    Get campaign status distribution for pie chart.
    Returns count of campaigns by status.
    """
    query = select(
        Campaign.status,
        func.count(Campaign.id).label('count')
    ).where(
        Campaign.is_active == 1
    ).group_by(Campaign.status)
    
    result = await db.execute(query)
    rows = result.all()
    
    data = [
        {
            "status": row.status.value if hasattr(row.status, 'value') else row.status,
            "count": row.count,
            "name": row.status.value.replace('_', ' ').title() if hasattr(row.status, 'value') else row.status
        }
        for row in rows
    ]
    
    return {"data": data}


@router.get("/expense-trend")
async def get_expense_trend(
    days: int = 30,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.ANALYTICS_VIEW))
):
    """
    Get expense trend over time for line chart.
    Returns daily expense totals for the specified period.
    """
    # Calculate date range
    end_date = datetime.now(timezone.utc).date()
    start_date = end_date - timedelta(days=days)
    
    # Query daily expense totals
    query = select(
        cast(Expense.submitted_date, Date).label('date'),
        func.sum(Expense.amount).label('total')
    ).where(
        and_(
            Expense.is_active == 1,
            Expense.submitted_date.isnot(None),
            Expense.submitted_date >= start_date,
            Expense.submitted_date <= end_date
        )
    ).group_by(
        cast(Expense.submitted_date, Date)
    ).order_by(cast(Expense.submitted_date, Date))
    
    result = await db.execute(query)
    rows = result.all()
    
    data = [
        {
            "date": row.date.strftime('%Y-%m-%d') if row.date else None,
            "amount": float(row.total) if row.total else 0
        }
        for row in rows
    ]
    
    return {"data": data, "period_days": days}


@router.get("/payments-summary")
async def get_payments_summary(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.ANALYTICS_VIEW))
):
    """
    Get payment status summary for bar chart.
    Returns total amount by invoice status.
    """
    query = select(
        Invoice.status,
        func.count(Invoice.id).label('count'),
        func.sum(Invoice.amount).label('total_amount')
    ).where(
        Invoice.is_active == 1
    ).group_by(Invoice.status)
    
    result = await db.execute(query)
    rows = result.all()
    
    data = [
        {
            "status": row.status.value if hasattr(row.status, 'value') else row.status,
            "count": row.count,
            "amount": float(row.total_amount) if row.total_amount else 0,
            "name": row.status.value.replace('_', ' ').title() if hasattr(row.status, 'value') else row.status
        }
        for row in rows
    ]
    
    return {"data": data}


@router.get("/vendor-performance")
async def get_vendor_performance(
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.ANALYTICS_VIEW))
):
    """
    Get top vendors by invoice amount.
    Returns vendor name with total invoice amount and payment status.
    """
    # Subquery for paid invoices per vendor
    paid_query = select(
        Invoice.vendor_id,
        func.sum(Invoice.amount).label('paid_amount')
    ).where(
        and_(
            Invoice.is_active == 1,
            Invoice.status == InvoiceStatus.PAID
        )
    ).group_by(Invoice.vendor_id).subquery()
    
    # Main query
    query = select(
        Vendor.id,
        Vendor.name,
        func.count(Invoice.id).label('invoice_count'),
        func.sum(Invoice.amount).label('total_amount'),
        func.coalesce(paid_query.c.paid_amount, 0).label('paid_amount')
    ).outerjoin(
        Invoice, and_(Invoice.vendor_id == Vendor.id, Invoice.is_active == 1)
    ).outerjoin(
        paid_query, paid_query.c.vendor_id == Vendor.id
    ).where(
        Vendor.is_active == 1
    ).group_by(
        Vendor.id, Vendor.name, paid_query.c.paid_amount
    ).order_by(
        func.sum(Invoice.amount).desc()
    ).limit(limit)
    
    result = await db.execute(query)
    rows = result.all()
    
    data = [
        {
            "vendor_id": row.id,
            "vendor_name": row.name,
            "invoice_count": row.invoice_count,
            "total_amount": float(row.total_amount) if row.total_amount else 0,
            "paid_amount": float(row.paid_amount) if row.paid_amount else 0,
            "pending_amount": float(row.total_amount - row.paid_amount) if row.total_amount and row.paid_amount else (float(row.total_amount) if row.total_amount else 0)
        }
        for row in rows
    ]
    
    return {"data": data}


@router.get("/utilization-summary")
async def get_utilization_summary(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.ANALYTICS_VIEW))
):
    """
    Get driver and vehicle utilization summary.
    Returns counts and basic stats.
    """
    # Count active drivers
    driver_query = select(func.count(Driver.id)).where(Driver.is_active == 1)
    driver_result = await db.execute(driver_query)
    total_drivers = driver_result.scalar()
    
    # Count active vehicles
    vehicle_query = select(func.count(Vehicle.id)).where(Vehicle.is_active == 1)
    vehicle_result = await db.execute(vehicle_query)
    total_vehicles = vehicle_result.scalar()
    
    # Count active campaigns
    campaign_query = select(func.count(Campaign.id)).where(
        and_(
            Campaign.is_active == 1,
            Campaign.status == CampaignStatus.RUNNING
        )
    )
    campaign_result = await db.execute(campaign_query)
    running_campaigns = campaign_result.scalar()
    
    # Get vehicle types distribution
    vehicle_type_query = select(
        Vehicle.vehicle_type,
        func.count(Vehicle.id).label('count')
    ).where(
        Vehicle.is_active == 1
    ).group_by(Vehicle.vehicle_type)
    
    vehicle_type_result = await db.execute(vehicle_type_query)
    vehicle_types = vehicle_type_result.all()
    
    data = {
        "drivers": {
            "total": total_drivers or 0
        },
        "vehicles": {
            "total": total_vehicles or 0,
            "by_type": [
                {
                    "type": row.vehicle_type,
                    "count": row.count
                }
                for row in vehicle_types
            ]
        },
        "campaigns": {
            "running": running_campaigns or 0
        }
    }
    
    return {"data": data}
