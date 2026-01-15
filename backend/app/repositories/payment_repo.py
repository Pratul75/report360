from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case
from app.models.payment import Payment, PaymentStatus
from datetime import date

class PaymentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.model = Payment
    
    async def get_all(self):
        """Get all active payments"""
        result = await self.db.execute(
            select(Payment).where(Payment.is_active == True)
        )
        return result.scalars().all()
    
    async def get_by_id(self, id: int):
        """Get payment by ID"""
        result = await self.db.execute(
            select(Payment).where(
                Payment.id == id,
                Payment.is_active == True
            )
        )
        return result.scalar_one_or_none()
    
    async def create(self, payment: Payment):
        """Create new payment"""
        self.db.add(payment)
        await self.db.commit()
        await self.db.refresh(payment)
        return payment
    
    async def update(self, id: int, data: dict):
        """Update payment"""
        payment = await self.get_by_id(id)
        if not payment:
            return None
        for key, value in data.items():
            if hasattr(payment, key):
                setattr(payment, key, value)
        await self.db.commit()
        await self.db.refresh(payment)
        return payment
    
    async def delete(self, id: int):
        """Soft delete payment"""
        payment = await self.get_by_id(id)
        if payment:
            payment.is_active = False
            await self.db.commit()
    
    async def get_by_vendor(self, vendor_id: int):
        """Get all payments for a specific vendor"""
        result = await self.db.execute(
            select(Payment).where(
                Payment.vendor_id == vendor_id,
                Payment.is_active == True
            )
        )
        return result.scalars().all()
    
    async def get_by_invoice(self, invoice_id: int):
        """Get payment for a specific invoice"""
        result = await self.db.execute(
            select(Payment).where(
                Payment.invoice_id == invoice_id,
                Payment.is_active == True
            )
        )
        return result.scalar_one_or_none()
    
    async def get_by_status(self, status: str, vendor_id: int = None):
        """Get payments by status, optionally filtered by vendor"""
        query = select(Payment).where(
            Payment.status == status,
            Payment.is_active == True
        )
        if vendor_id:
            query = query.where(Payment.vendor_id == vendor_id)
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def get_total_amount(self) -> float:
        """Get total amount of all active payments"""
        result = await self.db.execute(
            select(func.sum(Payment.amount)).where(
                Payment.is_active == True
            )
        )
        total = result.scalar()
        return float(total) if total else 0.0
    
    async def get_total_by_status(self, status: str) -> float:
        """Get total amount of payments by status"""
        result = await self.db.execute(
            select(func.sum(Payment.amount)).where(
                Payment.status == status,
                Payment.is_active == True
            )
        )
        total = result.scalar()
        return float(total) if total else 0.0
    
    async def get_completed_amount(self) -> float:
        """Get total amount of completed payments"""
        return await self.get_total_by_status(PaymentStatus.COMPLETED.value)
    
    async def get_pending_amount(self) -> float:
        """Get total amount of pending payments"""
        return await self.get_total_by_status(PaymentStatus.PENDING.value)
    
    async def get_monthly_total(self) -> float:
        """Get total completed payments for current month"""
        today = date.today()
        first_day = today.replace(day=1)
        result = await self.db.execute(
            select(func.sum(Payment.amount)).where(
                Payment.payment_date >= first_day,
                Payment.status == PaymentStatus.COMPLETED,
                Payment.is_active == True
            )
        )
        total = result.scalar()
        return float(total) if total else 0.0
    
    async def get_vendor_summary(self):
        """Get payment summary grouped by vendor"""
        from app.models.vendor import Vendor
        result = await self.db.execute(
            select(
                Vendor.id,
                Vendor.name,
                func.count(Payment.id).label('payment_count'),
                func.sum(Payment.amount).label('total_amount'),
                func.sum(
                    case(
                        (Payment.status == PaymentStatus.COMPLETED, Payment.amount),
                        else_=0
                    )
                ).label('completed_amount'),
                func.sum(
                    case(
                        (Payment.status == PaymentStatus.PENDING, Payment.amount),
                        else_=0
                    )
                ).label('pending_amount')
            )
            .join(Payment, Payment.vendor_id == Vendor.id)
            .where(Payment.is_active == True, Vendor.is_active == True)
            .group_by(Vendor.id, Vendor.name)
        )
        return result.all()
    
    async def count_pending(self) -> int:
        """Count pending payments"""
        result = await self.db.execute(
            select(func.count(Payment.id)).where(
                Payment.status == PaymentStatus.PENDING,
                Payment.is_active == True
            )
        )
        return result.scalar() or 0
