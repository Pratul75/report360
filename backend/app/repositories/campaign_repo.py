from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session, joinedload
from app.repositories.base_repo import BaseRepository
from app.models.campaign import Campaign
from app.models.project import Project
from app.models.client import Client
from app.models.invoice import Invoice
from app.models.vendor import Vendor

class CampaignRepository(BaseRepository):
    def __init__(self, db: Session = None):
        super().__init__(Campaign)
        self.db = db
    
    async def _populate_vendor_names(self, db: AsyncSession, campaign):
        """Get vendor names and IDs assigned to this campaign through invoices"""
        query = select(Vendor.id, Vendor.name).join(
            Invoice, Invoice.vendor_id == Vendor.id
        ).where(
            Invoice.campaign_id == campaign.id,
            Invoice.is_active == True
        ).distinct()
        
        result = await db.execute(query)
        rows = result.all()
        vendor_names = [row[1] for row in rows]
        vendor_ids = [row[0] for row in rows]
        campaign.vendor_names = vendor_names
        campaign.vendor_ids = vendor_ids
    
    async def get_by_id(self, db: AsyncSession, id: int):
        """Get campaign by ID with project, client, and vendor relationships loaded"""
        query = select(Campaign).where(
            Campaign.id == id,
            Campaign.is_active == 1  # Only return active campaigns
        ).options(
            joinedload(Campaign.project).joinedload(Project.client)
        )
        result = await db.execute(query)
        campaign = result.scalar_one_or_none()
        
        if campaign:
            # Populate project_name and client_name if relationships exist
            if hasattr(campaign, 'project') and campaign.project:
                campaign.project_name = campaign.project.name
                if hasattr(campaign.project, 'client') and campaign.project.client:
                    campaign.client_name = campaign.project.client.name
            
            # Populate vendor names
            await self._populate_vendor_names(db, campaign)
        
        return campaign
    
    async def get_all(self, db: AsyncSession, filters: dict = None):
        """Get all campaigns with project, client, and vendor relationships loaded"""
        query = select(Campaign).options(
            joinedload(Campaign.project).joinedload(Project.client)
        ).where(
            Campaign.is_active == 1  # Only return active campaigns
        )
        
        if filters:
            for key, value in filters.items():
                if hasattr(Campaign, key):
                    query = query.where(getattr(Campaign, key) == value)
        
        result = await db.execute(query)
        campaigns = result.scalars().unique().all()
        
        # Populate project_name, client_name, and vendor_names for each campaign
        for campaign in campaigns:
            if hasattr(campaign, 'project') and campaign.project:
                campaign.project_name = campaign.project.name
                if hasattr(campaign.project, 'client') and campaign.project.client:
                    campaign.client_name = campaign.project.client.name
            
            # Populate vendor names and IDs
            await self._populate_vendor_names(db, campaign)
        
        return campaigns
    
    async def get_by_project(self, db: AsyncSession, project_id: int):
        """Get campaigns by project ID"""
        query = select(Campaign).where(
            Campaign.project_id == project_id,
            Campaign.is_active == 1  # Only return active campaigns
        )
        result = await db.execute(query)
        return result.scalars().all()
    
    async def get_by_status(self, db: AsyncSession, status: str):
        """Get campaigns by status"""
        return await self.get_all(db, {"status": status})
    
    def get_by_id_sync(self, id: int):
        """Get campaign by ID (sync)"""
        return self.db.query(Campaign).filter(Campaign.id == id).first()
    
    def get_all_sync(self):
        """Get all campaigns (sync)"""
        return self.db.query(Campaign).all()
    
    async def get_running_campaigns(self, db: AsyncSession):
        """Get running campaigns"""
        return await self.get_all(db, {"status": "running"})
    
    async def get_status_counts(self, db: AsyncSession):
        """Get count of campaigns by status"""
        query = select(
            Campaign.status,
            func.count(Campaign.id).label('count')
        ).where(
            Campaign.is_active == 1  # Only count active campaigns
        ).group_by(Campaign.status)
        
        result = await db.execute(query)
        rows = result.all()
        
        # Convert to dict with lowercase keys
        status_dict = {}
        for row in rows:
            if row[0]:  # if status is not None
                status_dict[row[0].lower()] = row[1]
        
        return status_dict
