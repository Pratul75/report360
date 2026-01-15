from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.database.connection import get_db
from app.core.security import get_current_user
from app.repositories.payment_repo import PaymentRepository
from app.schemas.payment import PaymentCreate, PaymentUpdate, PaymentResponse
from app.models.payment import Payment

router = APIRouter(prefix="/payments", tags=["payments"])

@router.get("", response_model=List[PaymentResponse])
async def get_payments(
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get payments - vendors see only their own, admins/accounts see all"""
    repo = PaymentRepository(db)
    
    # Get vendor_id if user is a vendor
    vendor_id = current_user.get("vendor_id") if current_user.get("role") == "vendor" else None
    
    if vendor_id:
        # Vendor can only see their own payments
        payments = await repo.get_by_vendor(vendor_id)
    else:
        # Admin/Accounts see all
        payments = await repo.get_all()
    
    # Apply filters
    if status:
        payments = [p for p in payments if p.status == status]
    
    return payments

@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(
    payment_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific payment"""
    repo = PaymentRepository(db)
    payment = await repo.get_by_id(payment_id)
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # Check authorization
    if current_user.get("role") == "vendor" and payment.vendor_id != current_user.get("vendor_id"):
        raise HTTPException(status_code=403, detail="Not authorized to view this payment")
    
    return payment

@router.post("", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_payment(
    payment: PaymentCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new payment - only admin/accounts can create"""
    if current_user.get("role") not in ["admin", "accounts"]:
        raise HTTPException(status_code=403, detail="Not authorized to create payments")
    
    repo = PaymentRepository(db)
    
    # Get vendor_id from invoice
    from app.repositories.invoice_repo import InvoiceRepository
    invoice_repo = InvoiceRepository(db)
    invoice = await invoice_repo.get_by_id(payment.invoice_id)
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    payment_dict = payment.dict()
    payment_dict['vendor_id'] = invoice.vendor_id
    
    new_payment = Payment(**payment_dict)
    created = await repo.create(new_payment)
    
    # Update invoice status to paid if payment is completed
    if payment.status == "completed":
        await invoice_repo.update(invoice.id, {"status": "paid"})
    
    return created

@router.put("/{payment_id}", response_model=PaymentResponse)
async def update_payment(
    payment_id: int,
    payment: PaymentUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a payment - only admin/accounts can update"""
    if current_user.get("role") not in ["admin", "accounts"]:
        raise HTTPException(status_code=403, detail="Not authorized to update payments")
    
    repo = PaymentRepository(db)
    existing = await repo.get_by_id(payment_id)
    
    if not existing:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    updated = await repo.update(payment_id, payment.dict(exclude_unset=True))
    
    # Update invoice status if payment is completed
    if payment.status == "completed":
        from app.repositories.invoice_repo import InvoiceRepository
        invoice_repo = InvoiceRepository(db)
        await invoice_repo.update(existing.invoice_id, {"status": "paid"})
    
    return updated

@router.delete("/{payment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_payment(
    payment_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a payment - admin only"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete payments")
    
    repo = PaymentRepository(db)
    await repo.delete(payment_id)
    return None
