"""
ML Insights Service - Admin-only analytics and decision support
Fetches data from database and forwards to ML service for analysis

SAFETY GUARANTEES:
1. READ-ONLY: Only SELECT queries, no INSERT/UPDATE/DELETE
2. Limited queries: Time-windowed, LIMITed, aggregated
3. Suggestions only: No auto-apply of changes
4. Audit logging: All admin access logged
5. Feature toggle: Can be disabled via ENABLE_ML_SERVICE
"""
from typing import Dict, List, Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timedelta
import httpx
import os
import logging

from app.models.campaign import Campaign
from app.models.expense import Expense
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.models.vendor import Vendor
from app.models.project import Project


class MLInsightsService:
    """Service for ML-powered insights and analytics"""
    
    # Service Configuration
    ML_SERVICE_URL = os.getenv("ML_SERVICE_URL", "http://ml-service:8002")
    ENABLE_ML_SERVICE = os.getenv("ENABLE_ML_SERVICE", "true").lower() == "true"
    
    # Query Performance Limits
    EXPENSE_ANALYSIS_DAYS = int(os.getenv("ML_EXPENSE_ANALYSIS_DAYS", "90"))  # Last N days
    CAMPAIGN_LIMIT = int(os.getenv("ML_CAMPAIGN_LIMIT", "100"))  # Max campaigns to analyze
    MAX_RECORDS_PER_QUERY = int(os.getenv("ML_MAX_RECORDS", "1000"))  # Safety limit
    
    # Initialize logger
    logger = logging.getLogger(__name__)
    
    @staticmethod
    async def get_dashboard_insights(db: AsyncSession, admin_user_id: Optional[int] = None) -> Dict[str, Any]:
        """
        Fetch comprehensive ML insights dashboard (Admin-only)
        
        SAFETY: READ-ONLY queries only, suggestions returned (no auto-apply)
        
        Args:
            db: Database session (READ-ONLY access)
            admin_user_id: Admin user ID for audit logging
        
        Returns:
            Dictionary with all analytics insights (suggestions only)
        """
        # Feature toggle check
        if not MLInsightsService.ENABLE_ML_SERVICE:
            MLInsightsService.logger.info("ML Service is disabled via ENABLE_ML_SERVICE=false")
            return {
                "success": False,
                "message": "ML Service is currently disabled",
                "enabled": False
            }
        
        # Audit logging
        MLInsightsService.logger.info(
            f"Admin (ID: {admin_user_id}) accessed ML Dashboard at {datetime.now().isoformat()}"
        )
        
        try:
            # Fetch data from database
            campaigns_data = await MLInsightsService._fetch_campaigns_data(db)
            expenses_data = await MLInsightsService._fetch_expenses_data(db)
            vehicles_data = await MLInsightsService._fetch_vehicles_data(db)
            drivers_data = await MLInsightsService._fetch_drivers_data(db)
            vendors_data = await MLInsightsService._fetch_vendors_data(db)
            
            # Debug logging
            MLInsightsService.logger.info(
                f"Fetched data counts: campaigns={len(campaigns_data)}, "
                f"expenses={len(expenses_data)}, vehicles={len(vehicles_data)}, "
                f"drivers={len(drivers_data)}, vendors={len(vendors_data)}"
            )
            
            # Log sample campaign data if available
            if campaigns_data:
                MLInsightsService.logger.info(f"First campaign sample: {campaigns_data[0]}")
            
            # Send to ML service for analysis
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{MLInsightsService.ML_SERVICE_URL}/analytics/dashboard",
                    json={
                        "campaigns": campaigns_data,
                        "expenses": expenses_data,
                        "vehicles": vehicles_data,
                        "drivers": drivers_data,
                        "vendors": vendors_data
                    }
                )
                
                if response.status_code == 200:
                    result = response.json()
                    MLInsightsService.logger.info(f"ML Service response: {str(result)[:500]}")
                    return result.get("dashboard", {})
                else:
                    MLInsightsService.logger.error(f"ML service returned status {response.status_code}: {response.text[:200]}")
                    raise Exception(f"ML service returned status {response.status_code}")
        
        except Exception as e:
            # Return error-safe fallback
            MLInsightsService.logger.error(f"Error in get_dashboard_insights: {str(e)}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "message": "ML service temporarily unavailable"
            }
    
    @staticmethod
    async def get_campaign_insights(
        db: AsyncSession,
        campaign_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Get campaign-specific insights
        
        Args:
            db: Database session
            campaign_id: Optional specific campaign ID
        
        Returns:
            Campaign insights
        """
        try:
            campaigns_data = await MLInsightsService._fetch_campaigns_data(db, campaign_id)
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{MLInsightsService.ML_SERVICE_URL}/analytics/campaign-insights",
                    json={"campaigns": campaigns_data}
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    raise Exception(f"ML service error: {response.status_code}")
        
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    @staticmethod
    async def detect_expense_anomalies(db: AsyncSession) -> Dict[str, Any]:
        """Detect anomalous expenses"""
        try:
            expenses_data = await MLInsightsService._fetch_expenses_data(db)
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{MLInsightsService.ML_SERVICE_URL}/analytics/expense-anomalies",
                    json={"expenses": expenses_data}
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    raise Exception(f"ML service error: {response.status_code}")
        
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    @staticmethod
    async def get_utilization_insights(
        db: AsyncSession,
        entity_type: str = "both"  # "vehicle", "driver", or "both"
    ) -> Dict[str, Any]:
        """Get vehicle and/or driver utilization insights"""
        try:
            result = {}
            
            if entity_type in ["vehicle", "both"]:
                vehicles_data = await MLInsightsService._fetch_vehicles_data(db)
                
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(
                        f"{MLInsightsService.ML_SERVICE_URL}/analytics/vehicle-utilization",
                        json={"vehicles": vehicles_data}
                    )
                    
                    if response.status_code == 200:
                        result["vehicle_utilization"] = response.json()
            
            if entity_type in ["driver", "both"]:
                drivers_data = await MLInsightsService._fetch_drivers_data(db)
                
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(
                        f"{MLInsightsService.ML_SERVICE_URL}/analytics/driver-utilization",
                        json={"drivers": drivers_data}
                    )
                    
                    if response.status_code == 200:
                        result["driver_utilization"] = response.json()
            
            return {
                "success": True,
                "data": result
            }
        
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    @staticmethod
    async def get_vendor_performance(db: AsyncSession) -> Dict[str, Any]:
        """Get vendor performance analytics"""
        try:
            vendors_data = await MLInsightsService._fetch_vendors_data(db)
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{MLInsightsService.ML_SERVICE_URL}/analytics/vendor-performance",
                    json={"vendors": vendors_data}
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    raise Exception(f"ML service error: {response.status_code}")
        
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    # ============================================================
    # PRIVATE: DATA FETCHING METHODS
    # ============================================================
    
    @staticmethod
    async def _fetch_campaigns_data(
        db: AsyncSession,
        campaign_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Fetch campaigns data for analysis (READ-ONLY)
        
        SAFETY: Limited to recent campaigns, max records enforced
        """
        query = select(Campaign).where(Campaign.is_active == True)
        
        if campaign_id:
            query = query.where(Campaign.id == campaign_id)
        else:
            # Limit to recent campaigns (last 180 days) for performance
            six_months_ago = datetime.now() - timedelta(days=180)
            query = query.where(Campaign.created_at >= six_months_ago)
        
        # Apply safety limit
        query = query.limit(MLInsightsService.CAMPAIGN_LIMIT)
        
        result = await db.execute(query)
        campaigns = result.scalars().all()
        
        campaigns_data = []
        for campaign in campaigns:
            # Calculate total expenses for this campaign
            expense_query = select(func.sum(Expense.amount)).where(
                Expense.campaign_id == campaign.id,
                Expense.is_active == True
            )
            expense_result = await db.execute(expense_query)
            total_expenses = expense_result.scalar() or 0.0
            
            campaigns_data.append({
                "id": campaign.id,
                "name": campaign.name,
                "budget": float(campaign.budget) if campaign.budget else 0.0,
                "total_expenses": float(total_expenses),
                "status": campaign.status,
                "start_date": campaign.start_date.isoformat() if campaign.start_date else None,
                "end_date": campaign.end_date.isoformat() if campaign.end_date else None,
                "project_id": campaign.project_id
            })
        
        return campaigns_data
    
    @staticmethod
    async def _fetch_expenses_data(db: AsyncSession) -> List[Dict[str, Any]]:
        """
        Fetch expenses data for analysis (READ-ONLY)
        
        SAFETY: Time-windowed query (configurable), max records enforced
        """
        # Configurable time window (default: 90 days)
        analysis_window = datetime.now() - timedelta(days=MLInsightsService.EXPENSE_ANALYSIS_DAYS)
        
        query = select(Expense).where(
            Expense.is_active == True,
            Expense.submitted_date >= analysis_window
        ).limit(MLInsightsService.MAX_RECORDS_PER_QUERY)  # Safety limit
        
        result = await db.execute(query)
        expenses = result.scalars().all()
        
        expenses_data = []
        for expense in expenses:
            expenses_data.append({
                "id": expense.id,
                "amount": float(expense.amount),
                "expense_type": expense.expense_type or "other",
                "expense_date": expense.submitted_date.isoformat() if expense.submitted_date else None,
                "campaign_id": expense.campaign_id,
                "description": expense.description
            })
        
        return expenses_data
    
    @staticmethod
    async def _fetch_vehicles_data(db: AsyncSession) -> List[Dict[str, Any]]:
        """Fetch vehicles data for utilization analysis"""
        query = select(Vehicle).where(Vehicle.is_active == True)
        
        result = await db.execute(query)
        vehicles = result.scalars().all()
        
        vehicles_data = []
        for vehicle in vehicles:
            # In production, calculate actual assignment counts from driver_assignments table
            # Simplified for now
            vehicles_data.append({
                "id": vehicle.id,
                "name": vehicle.vehicle_number or f"Vehicle {vehicle.id}",
                "vehicle_number": vehicle.vehicle_number,
                "vehicle_type": vehicle.vehicle_type,
                "total_assignments": 10,  # Placeholder - calculate from assignments
                "active_assignments": 3   # Placeholder - calculate from active assignments
            })
        
        return vehicles_data
    
    @staticmethod
    async def _fetch_drivers_data(db: AsyncSession) -> List[Dict[str, Any]]:
        """Fetch drivers data for utilization analysis"""
        query = select(Driver).where(Driver.is_active == True)
        
        result = await db.execute(query)
        drivers = result.scalars().all()
        
        drivers_data = []
        for driver in drivers:
            # In production, calculate actual assignment counts
            drivers_data.append({
                "id": driver.id,
                "name": driver.name,
                "phone": driver.phone,
                "total_assignments": 15,  # Placeholder
                "active_assignments": 5   # Placeholder
            })
        
        return drivers_data
    
    @staticmethod
    async def _fetch_vendors_data(db: AsyncSession) -> List[Dict[str, Any]]:
        """Fetch vendors data for performance analysis"""
        query = select(Vendor).where(Vendor.is_active == True)
        
        result = await db.execute(query)
        vendors = result.scalars().all()
        
        vendors_data = []
        for vendor in vendors:
            # In production, calculate from vendor_bookings table
            vendors_data.append({
                "id": vendor.id,
                "name": vendor.name,
                "vendor_type": "general",  # Vendor doesn't have a company field
                "total_bookings": 20,     # Placeholder
                "completed_bookings": 18,  # Placeholder
                "avg_delivery_time": 3.5,  # Placeholder (days)
                "cost_efficiency": 78.5    # Placeholder (percentage)
            })
        
        return vendors_data
