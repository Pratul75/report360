"""
Accounts & Payments Service
Provides dynamic financial calculations from database
"""
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.invoice_repo import InvoiceRepository
from app.repositories.payment_repo import PaymentRepository
from typing import Dict, List, Any

class AccountsService:
    """Service for accounts and payments financial calculations"""
    
    async def get_accounts_summary(self, db: AsyncSession) -> Dict[str, Any]:
        """
        Get comprehensive accounts summary with all dynamic calculations
        
        Returns:
            - total_invoices: Total invoice amount
            - total_paid: Total completed payments
            - total_pending: Total pending payments
            - paid_this_month: Payments completed this month
            - pending_count: Number of pending payments
            - vendor_summary: Payment breakdown by vendor
            - campaign_summary: Invoice breakdown by campaign
        """

        print('Getting accounts summary...')
        invoice_repo = InvoiceRepository(db)
        payment_repo = PaymentRepository(db)
        
        # Get invoice totals
        total_invoices = await invoice_repo.get_total_amount()
        pending_invoice_amount = await invoice_repo.get_pending_amount()
        
        # Get payment totals
        total_paid = await payment_repo.get_completed_amount()
        total_pending_payments = await payment_repo.get_pending_amount()
        paid_this_month = await payment_repo.get_monthly_total()
        pending_count = await payment_repo.count_pending()
        
        # Get vendor-wise summaries
        vendor_invoices = await invoice_repo.get_vendor_summary()
        vendor_payments = await payment_repo.get_vendor_summary()
        
        # Merge vendor data
        vendor_summary = self._merge_vendor_data(vendor_invoices, vendor_payments)
        
        # Get campaign-wise invoice summary
        campaign_summary = await invoice_repo.get_campaign_summary()
        
        # Calculate total payable (pending invoices)
        total_payable = pending_invoice_amount
        
        return {
            "total_invoices": round(total_invoices, 2),
            "total_paid": round(total_paid, 2),
            "total_pending": round(total_pending_payments, 2),
            "total_payable": round(total_payable, 2),
            "paid_this_month": round(paid_this_month, 2),
            "pending_count": pending_count,
            "vendor_summary": vendor_summary,
            "campaign_summary": [
                {
                    "campaign_id": row.id,
                    "campaign_name": row.name,
                    "invoice_count": row.invoice_count,
                    "total_amount": round(float(row.total_amount or 0), 2),
                    "paid_amount": round(float(row.paid_amount or 0), 2)
                }
                for row in campaign_summary
            ]
        }
    
    def _merge_vendor_data(self, invoices, payments) -> List[Dict[str, Any]]:
        """Merge vendor invoice and payment data"""
        vendor_map = {}
        
        # Add invoice data
        for row in invoices:
            vendor_map[row.id] = {
                "vendor_id": row.id,
                "vendor_name": getattr(row, "name", row.id),
                "invoice_count": row.invoice_count,
                "total_invoiced": round(float(row.total_amount or 0), 2),
                "invoice_paid": round(float(row.paid_amount or 0), 2),
                "invoice_pending": round(float(row.pending_amount or 0), 2),
                "payment_count": 0,
                "payment_completed": 0.0,
                "payment_pending": 0.0
            }
        
        # Add payment data
        for row in payments:
            if row.id not in vendor_map:
                vendor_map[row.id] = {
                    "vendor_id": row.id,
                    "vendor_name": getattr(row, "name", row.id),
                    "invoice_count": 0,
                    "total_invoiced": 0.0,
                    "invoice_paid": 0.0,
                    "invoice_pending": 0.0,
                    "payment_count": 0,
                    "payment_completed": 0.0,
                    "payment_pending": 0.0
                }
            
            vendor_map[row.id].update({
                "payment_count": row.payment_count,
                "payment_completed": round(float(row.completed_amount or 0), 2),
                "payment_pending": round(float(row.pending_amount or 0), 2)
            })
        
        return list(vendor_map.values())
    
    async def get_financial_metrics(self, db: AsyncSession) -> Dict[str, Any]:
        """
        Get key financial metrics for dashboard cards
        
        Returns metrics suitable for quick display cards
        """
        invoice_repo = InvoiceRepository(db)
        payment_repo = PaymentRepository(db)
        
        pending_payments = await payment_repo.get_pending_amount()
        paid_this_month = await payment_repo.get_monthly_total()
        total_payable = await invoice_repo.get_pending_amount()
        pending_count = await payment_repo.count_pending()
        
        return {
            "pending_payments": round(pending_payments, 2),
            "paid_this_month": round(paid_this_month, 2),
            "total_payable": round(total_payable, 2),
            "pending_count": pending_count
        }
