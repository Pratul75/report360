"""
ML Insights API - Admin-only endpoints for ML-powered analytics

SAFETY GUARANTEES:
1. Admin-only access (Permission.require_admin())
2. READ-ONLY operations (no data modifications)
3. Suggestions only (no auto-apply)
4. Audit logging (all access tracked)
5. Feature toggle (ENABLE_ML_SERVICE)
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import os

from app.database.connection import get_db
from app.core.permissions import Permission
from app.services.ml_insights_service import MLInsightsService

router = APIRouter(prefix="/ml-insights", tags=["ML Insights (Admin Only)"])

# Feature toggle
ENABLE_ML_SERVICE = os.getenv("ENABLE_ML_SERVICE", "true").lower() == "true"


def check_ml_service_enabled():
    """Dependency to check if ML service is enabled"""
    if not ENABLE_ML_SERVICE:
        raise HTTPException(
            status_code=503,
            detail="ML Service is currently disabled. Enable via ENABLE_ML_SERVICE=true"
        )


@router.get("/dashboard", dependencies=[Depends(Permission.require_admin()), Depends(check_ml_service_enabled)])
async def get_ml_dashboard(
    current_user: dict = Depends(Permission.require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """
    Get comprehensive ML insights dashboard
    
    **Admin-only endpoint - READ-ONLY - Suggestions Only**
    
    Provides:
    - Campaign performance insights (suggestions)
    - Expense anomalies (detection only, no auto-fix)
    - Vehicle/driver utilization (recommendations)
    - Vendor performance (analysis only)
    - Top recommendations (require admin approval)
    - Critical alerts (for review)
    
    SAFETY: All insights are suggestions - no automatic actions taken
    """
    admin_id = current_user.get("id")
    dashboard = await MLInsightsService.get_dashboard_insights(db, admin_user_id=admin_id)
    return dashboard


@router.get("/campaigns", dependencies=[Depends(Permission.require_admin()), Depends(check_ml_service_enabled)])
async def get_campaign_insights(
    campaign_id: Optional[int] = None,
    current_user: dict = Depends(Permission.require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """
    Get campaign performance insights
    
    **Admin-only endpoint - READ-ONLY - Suggestions Only**
    
    Query Parameters:
    - campaign_id: Optional - Get insights for specific campaign
    
    SAFETY: Returns performance analysis and recommendations only
    """
    insights = await MLInsightsService.get_campaign_insights(db, campaign_id)
    return insights


@router.get("/expenses/anomalies", dependencies=[Depends(Permission.require_admin()), Depends(check_ml_service_enabled)])
async def get_expense_anomalies(
    current_user: dict = Depends(Permission.require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """
    Detect anomalous expenses using ML
    
    **Admin-only endpoint - READ-ONLY - Detection Only**
    
    Returns expenses that deviate significantly from normal patterns
    
    SAFETY: Detection only - no automatic actions or corrections
    """
    anomalies = await MLInsightsService.detect_expense_anomalies(db)
    return anomalies


@router.get("/utilization", dependencies=[Depends(Permission.require_admin()), Depends(check_ml_service_enabled)])
async def get_utilization_insights(
    entity_type: str = "both",  # "vehicle", "driver", or "both"
    current_user: dict = Depends(Permission.require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """
    Get utilization insights for vehicles and/or drivers
    
    **Admin-only endpoint - READ-ONLY - Recommendations Only**
    
    Query Parameters:
    - entity_type: "vehicle", "driver", or "both" (default: "both")
    
    SAFETY: Analysis and recommendations only - no auto-assignment
    """
    if entity_type not in ["vehicle", "driver", "both"]:
        raise HTTPException(
            status_code=400,
            detail="entity_type must be 'vehicle', 'driver', or 'both'"
        )
    
    insights = await MLInsightsService.get_utilization_insights(db, entity_type)
    return insights


@router.get("/vendors/performance", dependencies=[Depends(Permission.require_admin()), Depends(check_ml_service_enabled)])
async def get_vendor_performance(
    current_user: dict = Depends(Permission.require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """
    Get vendor performance analytics
    
    **Admin-only endpoint - READ-ONLY - Analysis Only**
    
    Provides reliability scores, cost efficiency, and recommendations
    
    SAFETY: Performance analysis only - no vendor changes applied
    """
    performance = await MLInsightsService.get_vendor_performance(db)
    return performance


@router.get("/status")
async def get_ml_service_status():
    """
    Get ML service status (public endpoint for checking if enabled)
    
    Returns:
        enabled: Whether ML service is enabled
        message: Status message
    """
    return {
        "enabled": ENABLE_ML_SERVICE,
        "message": "ML Service is enabled" if ENABLE_ML_SERVICE else "ML Service is disabled",
        "config": {
            "expense_analysis_days": os.getenv("ML_EXPENSE_ANALYSIS_DAYS", "90"),
            "campaign_limit": os.getenv("ML_CAMPAIGN_LIMIT", "100"),
            "max_records": os.getenv("ML_MAX_RECORDS", "1000")
        }
    }


@router.get("/health", dependencies=[Depends(Permission.require_admin())])
async def check_ml_service_health():
    """
    Check if ML service is accessible
    
    **Admin-only endpoint**
    """
    import httpx
    
    if not ENABLE_ML_SERVICE:
        return {
            "ml_service": "disabled",
            "message": "ML Service is disabled via ENABLE_ML_SERVICE=false"
        }
    
    ml_service_url = os.getenv("ML_SERVICE_URL", "http://ml-service:8002")
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{ml_service_url}/health")
            
            if response.status_code == 200:
                return {
                    "ml_service": "healthy",
                    "url": ml_service_url,
                    "enabled": True,
                    "response": response.json()
                }
            else:
                return {
                    "ml_service": "unhealthy",
                    "status_code": response.status_code,
                    "enabled": True
                }
    except Exception as e:
        return {
            "ml_service": "unreachable",
            "error": str(e),
            "enabled": True
        }
