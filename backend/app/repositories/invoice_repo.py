from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case
from app.models.invoice import Invoice, InvoiceStatus
from datetime import datetime, date
from dateutil.relativedelta import relativedelta

class InvoiceRepository:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.model = Invoice
    
    async def get_all(self):
        """Get all active invoices"""
        result = await self.db.execute(
            select(Invoice).where(Invoice.is_active == True)
        )
        return result.scalars().all()
    
    async def get_by_id(self, id: int):
        """Get invoice by ID"""
        result = await self.db.execute(
            select(Invoice).where(
                Invoice.id == id,
                Invoice.is_active == True
            )
        )
        return result.scalar_one_or_none()
    
    async def create(self, invoice: Invoice):
        """Create new invoice"""
        self.db.add(invoice)
        await self.db.commit()
        await self.db.refresh(invoice)
        return invoice
    
    async def update(self, id: int, data: dict):
        """Update invoice"""
        invoice = await self.get_by_id(id)
        if not invoice:
            return None
        for key, value in data.items():
            if hasattr(invoice, key):
                setattr(invoice, key, value)
        await self.db.commit()
        await self.db.refresh(invoice)
        return invoice
    
    async def delete(self, id: int):
        """Soft delete invoice"""
        invoice = await self.get_by_id(id)
        if invoice:
            invoice.is_active = False
            await self.db.commit()
    
    async def get_by_vendor(self, vendor_id: int):
        """Get all invoices for a specific vendor"""
        result = await self.db.execute(
            select(Invoice).where(
                Invoice.vendor_id == vendor_id,
                Invoice.is_active == True
            )
        )
        return result.scalars().all()
    
    async def get_by_campaign(self, campaign_id: int):
        """Get all invoices for a specific campaign"""
        result = await self.db.execute(
            select(Invoice).where(
                Invoice.campaign_id == campaign_id,
                Invoice.is_active == True
            )
        )
        return result.scalars().all()
    
    async def get_by_status(self, status: str, vendor_id: int = None):
        """Get invoices by status, optionally filtered by vendor"""
        query = select(Invoice).where(
            Invoice.status == status,
            Invoice.is_active == True
        )
        if vendor_id:
            query = query.where(Invoice.vendor_id == vendor_id)
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def get_total_amount(self) -> float:
        """Get total amount of all active invoices"""
        result = await self.db.execute(
            select(func.sum(Invoice.amount)).where(
                Invoice.is_active == True
            )
        )
        total = result.scalar()
        return float(total) if total else 0.0
    
    async def get_total_by_status(self, status: str) -> float:
        """Get total amount of invoices by status"""
        result = await self.db.execute(
            select(func.sum(Invoice.amount)).where(
                Invoice.status == status,
                Invoice.is_active == True
            )
        )
        total = result.scalar()
        return float(total) if total else 0.0
    
    async def get_pending_amount(self) -> float:
        """Get total amount of pending invoices (not paid)"""
        result = await self.db.execute(
            select(func.sum(Invoice.amount)).where(
                Invoice.status != InvoiceStatus.PAID,
                Invoice.is_active == True
            )
        )
        total = result.scalar()
        return float(total) if total else 0.0
    
    async def get_vendor_summary(self):
        """Get invoice summary grouped by vendor"""
        from app.models.vendor import Vendor
        result = await self.db.execute(
            select(
                Vendor.id,
                Vendor.name,
                func.count(Invoice.id).label('invoice_count'),
                func.sum(Invoice.amount).label('total_amount'),
                func.sum(
                    case(
                        (Invoice.status == InvoiceStatus.PAID, Invoice.amount),
                        else_=0
                    )
                ).label('paid_amount'),
                func.sum(
                    case(
                        (Invoice.status != InvoiceStatus.PAID, Invoice.amount),
                        else_=0
                    )
                ).label('pending_amount')
            )
            .join(Invoice, Invoice.vendor_id == Vendor.id)
            .where(Invoice.is_active == True, Vendor.is_active == True)
            .group_by(Vendor.id, Vendor.name)
        )
        return result.all()
    
    async def get_campaign_summary(self):
        """Get invoice summary grouped by campaign"""
        from app.models.campaign import Campaign
        result = await self.db.execute(
            select(
                Campaign.id,
                Campaign.name,
                func.count(Invoice.id).label('invoice_count'),
                func.sum(Invoice.amount).label('total_amount'),
                func.sum(
                    case(
                        (Invoice.status == InvoiceStatus.PAID, Invoice.amount),
                        else_=0
                    )
                ).label('paid_amount')
            )
            .join(Invoice, Invoice.campaign_id == Campaign.id)
            .where(Invoice.is_active == True, Campaign.is_active == True)
            .group_by(Campaign.id, Campaign.name)
        )
        return result.all()
    
    async def get_monthly_total(self) -> float:
        """Get total invoices for current month"""
        today = date.today()
        first_day = today.replace(day=1)
        result = await self.db.execute(
            select(func.sum(Invoice.amount)).where(
                Invoice.invoice_date >= first_day,
                Invoice.is_active == True
            )
        )
        total = result.scalar()
        return float(total) if total else 0.0
