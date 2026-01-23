"""
Accounts & Payments API Endpoints
Admin-only routes for financial management
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.connection import get_db
from app.core.permissions import Permission
from app.core.security import get_current_user
from app.services.accounts_service import AccountsService
from typing import Dict, Any, Optional
from fastapi import Query

router = APIRouter(prefix="/accounts", tags=["accounts"])

@router.get("/summary", response_model=Dict[str, Any], dependencies=[Depends(Permission.require_accounts())])
async def get_accounts_summary(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None)
):
    """
    Get comprehensive accounts & payments summary (Admin Only)
    
    Returns:
        - Financial totals (invoices, payments, pending)
        - Vendor-wise breakdown
        - Campaign-wise breakdown
    """
    service = AccountsService()
    summary = await service.get_accounts_summary(db, from_date=from_date, to_date=to_date)
    print('summary', summary)
    return summary

@router.get("/metrics", response_model=Dict[str, Any], dependencies=[Depends(Permission.require_accounts())])
async def get_financial_metrics(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None)
):
    """
    Get key financial metrics for dashboard cards (Admin Only)
    
    Returns quick metrics suitable for dashboard display
    """
    service = AccountsService()
    metrics = await service.get_financial_metrics(db, from_date=from_date, to_date=to_date)
    return metrics
