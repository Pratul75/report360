"""
Operations API Endpoints
Routes for operations dashboard and monitoring
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.connection import get_db
from app.core.permissions import Permission
from app.core.security import get_current_user
from app.services.operations_service import OperationsService
from typing import Dict, Any, Optional
from datetime import date

router = APIRouter(prefix="/operations", tags=["operations"])

@router.get("/summary", response_model=Dict[str, Any], dependencies=[Depends(Permission.require_operations())])
async def get_operations_summary(
    from_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    to_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get comprehensive operations summary (Admin/Operations Manager)
    
    Query Parameters:
        - from_date: Start date for filtering (default: today)
        - to_date: End date for filtering (default: today)
    
    Returns:
        - Campaign counts by status
        - Active drivers count
        - Reports submitted in date range
        - Issues and alerts
    """
    
    # Parse dates if provided
    parsed_from_date = None
    parsed_to_date = None
    
    try:
        if from_date:
            parsed_from_date = date.fromisoformat(from_date)
        if to_date:
            parsed_to_date = date.fromisoformat(to_date)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD"
        )
    
    service = OperationsService()
    summary = await service.get_operations_summary(db, parsed_from_date, parsed_to_date)
    return summary

@router.get("/metrics", response_model=Dict[str, Any], dependencies=[Depends(Permission.require_operations())])
async def get_operations_metrics(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get key operations metrics for dashboard cards (Admin/Operations Manager)
    
    Returns quick metrics suitable for dashboard display
    """
    
    service = OperationsService()
    metrics = await service.get_operations_metrics(db)
    return metrics
