from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from app.models.user import User
from app.models.campaign import Campaign
from app.repositories.vehicle_repo import VehicleRepository
from app.repositories.driver_repo import DriverRepository
from app.repositories.invoice_repo import InvoiceRepository
from app.repositories.payment_repo import PaymentRepository
from app.repositories.campaign_repo import CampaignRepository
from app.schemas.vendor_dashboard import VendorDashboardData, VendorDashboardSummary
from typing import Optional

class VendorDashboardService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.vehicle_repo = VehicleRepository(db)
        self.driver_repo = DriverRepository(db)
        self.invoice_repo = InvoiceRepository(db)
        self.payment_repo = PaymentRepository(db)
        self.campaign_repo = CampaignRepository(db)
    
    def get_vendor_id_from_user(self, user) -> int:
        """Get vendor_id from authenticated user (dict from JWT)"""
        user_role = user.get("role") if isinstance(user, dict) else user.role
        user_vendor_id = user.get("vendor_id") if isinstance(user, dict) else user.vendor_id
        
        if user_role == "admin":
            return None  # Admin can see all
        
        if user_role == "vendor":
            if not user_vendor_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Vendor user must be linked to a vendor"
                )
            return user_vendor_id
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only vendors and admins can access vendor dashboard"
        )
    
    async def get_dashboard_data(self, user, vendor_id: Optional[int] = None) -> VendorDashboardData:
        """Get complete vendor dashboard data"""
        user_role = user.get("role") if isinstance(user, dict) else user.role
        
        # If admin and specific vendor_id provided, use that; otherwise use user's vendor_id
        if user_role == "admin" and vendor_id:
            target_vendor_id = vendor_id
        else:
            target_vendor_id = self.get_vendor_id_from_user(user)
        
        # Get all data (using async methods)
        if target_vendor_id:
            vehicles = await self.vehicle_repo.get_by_vendor_async(self.db, target_vendor_id)
            drivers = await self.driver_repo.get_by_vendor_async(self.db, target_vendor_id)
            invoices = await self.invoice_repo.get_by_vendor(target_vendor_id)
            payments = await self.payment_repo.get_by_vendor(target_vendor_id)
        else:
            vehicles = await self.vehicle_repo.get_active_vehicles(self.db)
            drivers = await self.driver_repo.get_active_drivers(self.db)
            invoices = await self.invoice_repo.get_all()
            payments = await self.payment_repo.get_all()
        
        # Get assigned campaigns (campaigns where vendor's vehicles are used)
        campaigns = []
        if target_vendor_id:
            # Get unique campaign IDs from invoices
            campaign_ids = list(set([inv.campaign_id for inv in invoices if inv.campaign_id]))
            print(f"DEBUG: Vendor {target_vendor_id} has {len(campaign_ids)} unique campaign IDs from {len(invoices)} invoices: {campaign_ids}")
            for cid in campaign_ids:
                if cid:
                    camp = await self.campaign_repo.get_by_id(self.db, cid)
                    if camp:
                        print(f"DEBUG: Loaded campaign {cid}: {camp.name}, vendor_names={getattr(camp, 'vendor_names', [])}")
                        # Ensure all fields are populated (get_by_id already does this)
                        campaigns.append(camp)
                    else:
                        print(f"DEBUG: Campaign {cid} not found or is inactive")
        else:
            # Admin sees all campaigns with vendor names
            campaigns = await self.campaign_repo.get_all(self.db)
        
        # Calculate summary
        total_revenue = sum([inv.amount for inv in invoices if inv.status == "paid"])
        pending_payments = len([p for p in payments if p.status == "pending"])
        
        summary = VendorDashboardSummary(
            total_campaigns=len(campaigns),
            total_vehicles=len(vehicles),
            total_drivers=len(drivers),
            total_invoices=len(invoices),
            pending_payments=pending_payments,
            total_revenue=total_revenue
        )
        
        return VendorDashboardData(
            summary=summary,
            assigned_campaigns=campaigns,
            vehicles=vehicles,
            drivers=drivers,
            invoices=invoices,
            payments=payments
        )
    
    async def get_menu_counts(self, user) -> dict:
        """Get vehicle and driver counts for dynamic menu visibility"""
        target_vendor_id = self.get_vendor_id_from_user(user)
        
        if target_vendor_id:
            vehicles = await self.vehicle_repo.get_by_vendor_async(self.db, target_vendor_id)
            drivers = await self.driver_repo.get_by_vendor_async(self.db, target_vendor_id)
        else:
            # Admin sees all
            vehicles = await self.vehicle_repo.get_active_vehicles(self.db)
            drivers = await self.driver_repo.get_active_drivers(self.db)
        
        return {
            "vehicle_count": len(vehicles),
            "driver_count": len(drivers),
            "campaign_count": 0  # Can add campaign count if needed
        }
