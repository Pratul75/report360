"""
Client Service - Safe Cascade Delete Implementation

This service handles safe deletion of clients with complete cascade to all related entities.
Uses soft-delete (is_active=0) to maintain data integrity and allow potential recovery.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from datetime import datetime, timezone
from typing import Dict, List
import logging

from app.models.client import Client
from app.models.project import Project
from app.models.campaign import Campaign
from app.models.expense import Expense
from app.models.report import Report
from app.models.invoice import Invoice
from app.models.promoter_activity import PromoterActivity
from app.models.driver_assignment import DriverAssignment

logger = logging.getLogger(__name__)


class ClientService:
    """Service for safe client operations including cascade delete"""
    
    @staticmethod
    async def safe_delete_client(db: AsyncSession, client_id: int) -> Dict[str, any]:
        """
        Safely delete a client and all related data using soft-delete (is_active=0)
        
        This is a TRANSACTION-BASED operation - either all entities are soft-deleted
        or none (rollback on failure).
        
        Cascade Order:
        1. Client (is_active=0)
        2. All Projects under this client (is_active=0)
        3. All Campaigns under these projects (is_active=0)
        4. All Expenses under these campaigns (is_active=0)
        5. All Reports under these campaigns (is_active=0)
        6. All Invoices linked to these campaigns (is_active=0)
        7. All PromoterActivities under these campaigns (is_active=0)
        8. All DriverAssignments linked to these campaigns (is_active=0)
        
        Args:
            db: Database session
            client_id: ID of client to delete
            
        Returns:
            Dict with deletion summary
            
        Raises:
            Exception: If client not found or transaction fails
        """
        
        try:
            # Step 1: Verify client exists and is active
            client_query = select(Client).where(
                Client.id == client_id,
                Client.is_active == True
            )
            result = await db.execute(client_query)
            client = result.scalar_one_or_none()
            
            if not client:
                raise ValueError(f"Client with ID {client_id} not found or already deleted")
            
            logger.info(f"🗑️ Starting safe delete for Client ID: {client_id} ({client.name})")
            
            # Step 2: Get all projects under this client
            projects_query = select(Project).where(
                Project.client_id == client_id,
                Project.is_active == True
            )
            result = await db.execute(projects_query)
            projects = result.scalars().all()
            project_ids = [p.id for p in projects]
            
            logger.info(f"📊 Found {len(projects)} active projects to cascade delete")
            
            # Step 3: Get all campaigns under these projects
            campaigns = []
            campaign_ids = []
            if project_ids:
                campaigns_query = select(Campaign).where(
                    Campaign.project_id.in_(project_ids),
                    Campaign.is_active == True
                )
                result = await db.execute(campaigns_query)
                campaigns = result.scalars().all()
                campaign_ids = [c.id for c in campaigns]
                
                logger.info(f"📢 Found {len(campaigns)} active campaigns to cascade delete")
            
            # Initialize counters
            counts = {
                "client": 0,
                "projects": 0,
                "campaigns": 0,
                "expenses": 0,
                "reports": 0,
                "invoices": 0,
                "promoter_activities": 0,
                "driver_assignments": 0
            }
            
            # Step 4: Soft delete all related entities in transaction
            now = datetime.now(timezone.utc)
            
            # 4a. Delete expenses
            if campaign_ids:
                stmt = update(Expense).where(
                    Expense.campaign_id.in_(campaign_ids),
                    Expense.is_active == True
                ).values(is_active=False, updated_at=now)
                result = await db.execute(stmt)
                counts["expenses"] = result.rowcount
                logger.info(f"✅ Soft deleted {counts['expenses']} expenses")
            
            # 4b. Delete reports
            if campaign_ids:
                stmt = update(Report).where(
                    Report.campaign_id.in_(campaign_ids),
                    Report.is_active == True
                ).values(is_active=False, updated_at=now)
                result = await db.execute(stmt)
                counts["reports"] = result.rowcount
                logger.info(f"✅ Soft deleted {counts['reports']} reports")
            
            # 4c. Delete invoices (linked to campaigns)
            if campaign_ids:
                stmt = update(Invoice).where(
                    Invoice.campaign_id.in_(campaign_ids),
                    Invoice.is_active == True
                ).values(is_active=False, updated_at=now)
                result = await db.execute(stmt)
                counts["invoices"] = result.rowcount
                logger.info(f"✅ Soft deleted {counts['invoices']} invoices")
            
            # 4d. Delete promoter activities
            if campaign_ids:
                stmt = update(PromoterActivity).where(
                    PromoterActivity.campaign_id.in_(campaign_ids),
                    PromoterActivity.is_active == True
                ).values(is_active=False, updated_at=now)
                result = await db.execute(stmt)
                counts["promoter_activities"] = result.rowcount
                logger.info(f"✅ Soft deleted {counts['promoter_activities']} promoter activities")
            
            # 4e. Delete driver assignments
            if campaign_ids:
                stmt = update(DriverAssignment).where(
                    DriverAssignment.campaign_id.in_(campaign_ids),
                    DriverAssignment.is_active == True
                ).values(is_active=False, updated_at=now)
                result = await db.execute(stmt)
                counts["driver_assignments"] = result.rowcount
                logger.info(f"✅ Soft deleted {counts['driver_assignments']} driver assignments")
            
            # 4f. Delete campaigns
            if campaign_ids:
                stmt = update(Campaign).where(
                    Campaign.id.in_(campaign_ids),
                    Campaign.is_active == True
                ).values(is_active=False, updated_at=now)
                result = await db.execute(stmt)
                counts["campaigns"] = result.rowcount
                logger.info(f"✅ Soft deleted {counts['campaigns']} campaigns")
            
            # 4g. Delete projects
            if project_ids:
                stmt = update(Project).where(
                    Project.id.in_(project_ids),
                    Project.is_active == True
                ).values(is_active=False, updated_at=now)
                result = await db.execute(stmt)
                counts["projects"] = result.rowcount
                logger.info(f"✅ Soft deleted {counts['projects']} projects")
            
            # 4h. Finally, delete the client itself
            stmt = update(Client).where(
                Client.id == client_id,
                Client.is_active == True
            ).values(is_active=False, updated_at=now)
            result = await db.execute(stmt)
            counts["client"] = result.rowcount
            logger.info(f"✅ Soft deleted client: {client.name}")
            
            # Commit transaction
            await db.commit()
            
            logger.info(f"🎉 Successfully completed cascade delete for Client ID: {client_id}")
            logger.info(f"📈 Summary: {counts}")
            
            return {
                "success": True,
                "client_id": client_id,
                "client_name": client.name,
                "deleted_counts": counts,
                "message": f"Successfully deleted client '{client.name}' and all related data"
            }
            
        except Exception as e:
            # Rollback on any error
            await db.rollback()
            logger.error(f"❌ Error during cascade delete for Client ID {client_id}: {str(e)}")
            raise Exception(f"Failed to delete client: {str(e)}")
    
    
    @staticmethod
    async def get_client_deletion_preview(db: AsyncSession, client_id: int) -> Dict[str, any]:
        """
        Preview what will be deleted if we delete this client
        
        This is useful for showing a confirmation dialog to the user
        before actual deletion.
        
        Args:
            db: Database session
            client_id: ID of client
            
        Returns:
            Dict with counts of entities that will be affected
        """
        
        # Verify client exists
        client_query = select(Client).where(
            Client.id == client_id,
            Client.is_active == True
        )
        result = await db.execute(client_query)
        client = result.scalar_one_or_none()
        
        if not client:
            raise ValueError(f"Client with ID {client_id} not found")
        
        # Get projects
        projects_query = select(Project).where(
            Project.client_id == client_id,
            Project.is_active == True
        )
        result = await db.execute(projects_query)
        projects = result.scalars().all()
        project_ids = [p.id for p in projects]
        
        # Get campaigns
        campaigns = []
        campaign_ids = []
        if project_ids:
            campaigns_query = select(Campaign).where(
                Campaign.project_id.in_(project_ids),
                Campaign.is_active == True
            )
            result = await db.execute(campaigns_query)
            campaigns = result.scalars().all()
            campaign_ids = [c.id for c in campaigns]
        
        # Count related entities
        counts = {
            "projects": len(projects),
            "campaigns": len(campaigns),
            "expenses": 0,
            "reports": 0,
            "invoices": 0,
            "promoter_activities": 0,
            "driver_assignments": 0
        }
        
        if campaign_ids:
            # Count expenses
            from sqlalchemy import func
            result = await db.execute(
                select(func.count(Expense.id)).where(
                    Expense.campaign_id.in_(campaign_ids),
                    Expense.is_active == True
                )
            )
            counts["expenses"] = result.scalar()
            
            # Count reports
            result = await db.execute(
                select(func.count(Report.id)).where(
                    Report.campaign_id.in_(campaign_ids),
                    Report.is_active == True
                )
            )
            counts["reports"] = result.scalar()
            
            # Count invoices
            result = await db.execute(
                select(func.count(Invoice.id)).where(
                    Invoice.campaign_id.in_(campaign_ids),
                    Invoice.is_active == True
                )
            )
            counts["invoices"] = result.scalar()
            
            # Count promoter activities
            result = await db.execute(
                select(func.count(PromoterActivity.id)).where(
                    PromoterActivity.campaign_id.in_(campaign_ids),
                    PromoterActivity.is_active == True
                )
            )
            counts["promoter_activities"] = result.scalar()
            
            # Count driver assignments
            result = await db.execute(
                select(func.count(DriverAssignment.id)).where(
                    DriverAssignment.campaign_id.in_(campaign_ids),
                    DriverAssignment.is_active == True
                )
            )
            counts["driver_assignments"] = result.scalar()
        
        return {
            "client_id": client_id,
            "client_name": client.name,
            "will_delete": counts,
            "total_affected": sum(counts.values())
        }
