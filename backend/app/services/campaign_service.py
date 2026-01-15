from typing import List
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date
from app.repositories.campaign_repo import CampaignRepository
from app.schemas.campaign import (
    CampaignCreate, CampaignUpdate, CampaignResponse, CampaignAssignment
)
from app.models.invoice import Invoice, InvoiceStatus

class CampaignService:
    def __init__(self):
        self.campaign_repo = CampaignRepository()
    
    async def create_campaign(self, db: AsyncSession, campaign_data: CampaignCreate) -> CampaignResponse:
        """Create a new campaign"""
        data = campaign_data.model_dump()
        vendor_ids = data.pop("vendor_ids", [])  # Extract vendor_ids before creating campaign
        data["status"] = "planning"
        
        # Create campaign
        campaign = await self.campaign_repo.create(db, data)
        
        # Create placeholder invoices for each vendor to establish the relationship
        if vendor_ids:
            for vendor_id in vendor_ids:
                # Generate unique invoice number with timestamp
                invoice_number = f"PLACEHOLDER-{campaign.id}-{vendor_id}-{int(date.today().strftime('%Y%m%d'))}"
                placeholder_invoice = Invoice(
                    campaign_id=campaign.id,
                    vendor_id=vendor_id,
                    invoice_number=invoice_number,
                    amount=0.0,
                    invoice_date=date.today(),
                    status=InvoiceStatus.PENDING
                )
                db.add(placeholder_invoice)
            
            await db.commit()
            await db.refresh(campaign)
        
        return CampaignResponse.model_validate(campaign)
    
    async def get_campaign(self, db: AsyncSession, campaign_id: int) -> CampaignResponse:
        """Get campaign by ID"""
        campaign = await self.campaign_repo.get_by_id(db, campaign_id)
        
        if not campaign:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Campaign not found"
            )
        
        return CampaignResponse.model_validate(campaign)
    
    async def get_all_campaigns(self, db: AsyncSession) -> List[CampaignResponse]:
        """Get all campaigns"""
        campaigns = await self.campaign_repo.get_all(db)
        responses = []
        for campaign in campaigns:
            # Use model_validate to get the basic fields
            response_dict = {
                'id': campaign.id,
                'name': campaign.name,
                'description': campaign.description,
                'project_id': campaign.project_id,
                'campaign_type': campaign.campaign_type,
                'status': campaign.status,
                'start_date': campaign.start_date,
                'end_date': campaign.end_date,
                'budget': campaign.budget,
                'locations': campaign.locations,
                'created_at': campaign.created_at,
                'project_name': getattr(campaign, 'project_name', None),
                'client_name': getattr(campaign, 'client_name', None),
                'vendor_names': getattr(campaign, 'vendor_names', []),
                'vendor_ids': getattr(campaign, 'vendor_ids', []),
            }
            response = CampaignResponse(**response_dict)
            responses.append(response)
        return responses
    
    async def update_campaign(self, db: AsyncSession, campaign_id: int, update_data: CampaignUpdate) -> CampaignResponse:
        """Update campaign"""
        data = update_data.model_dump(exclude_unset=True)
        vendor_ids = data.pop("vendor_ids", None)  # Extract vendor_ids if provided
        
        # Update basic campaign data
        campaign = await self.campaign_repo.update(db, campaign_id, data)
        
        if not campaign:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Campaign not found"
            )
        
        # Update vendor assignments if vendor_ids were provided
        if vendor_ids is not None:
            from sqlalchemy import select, delete
            
            # Remove existing placeholder invoices for this campaign
            delete_stmt = delete(Invoice).where(
                Invoice.campaign_id == campaign_id,
                Invoice.invoice_number.like(f"PLACEHOLDER-{campaign_id}-%")
            )
            await db.execute(delete_stmt)
            
            # Create new placeholder invoices for each vendor
            for vendor_id in vendor_ids:
                invoice_number = f"PLACEHOLDER-{campaign_id}-{vendor_id}-{int(date.today().strftime('%Y%m%d'))}"
                placeholder_invoice = Invoice(
                    campaign_id=campaign_id,
                    vendor_id=vendor_id,
                    invoice_number=invoice_number,
                    amount=0.0,
                    invoice_date=date.today(),
                    status=InvoiceStatus.PENDING
                )
                db.add(placeholder_invoice)
            
            await db.commit()
            await db.refresh(campaign)
        
        return CampaignResponse.model_validate(campaign)
    
    async def delete_campaign(self, db: AsyncSession, campaign_id: int):
        """Delete campaign (soft delete)"""
        from sqlalchemy import update
        
        campaign = await self.campaign_repo.get_by_id(db, campaign_id)
        
        if not campaign:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Campaign not found"
            )
        
        # Soft delete the campaign
        await self.campaign_repo.delete(db, campaign_id)
        
        # Also soft delete associated placeholder invoices to maintain data consistency
        from datetime import datetime, timezone
        stmt = update(Invoice).where(
            Invoice.campaign_id == campaign_id,
            Invoice.invoice_number.like(f"PLACEHOLDER-{campaign_id}-%")
        ).values(
            is_active=False,
            updated_at=datetime.now(timezone.utc)
        )
        await db.execute(stmt)
        await db.commit()
    
    async def assign_resources(self, db: AsyncSession, assignment: CampaignAssignment):
        """Assign vehicles, drivers, and promoters to campaign"""
        # This would involve creating assignment records
        # Simplified for MVP
        pass
