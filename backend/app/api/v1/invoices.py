

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.database.connection import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.repositories.invoice_repo import InvoiceRepository
from app.repositories.payment_repo import PaymentRepository
from app.models.payment import PaymentStatus, Payment
from datetime import date
from app.schemas.invoice import InvoiceCreate, InvoiceUpdate, InvoiceResponse
from app.models.invoice import Invoice
import os
import shutil
from datetime import datetime
from app.core.permissions import Permission

router = APIRouter(prefix="/invoices", tags=["invoices"])

# Approve invoice endpoint (admin/accounts only)
@router.post("/{invoice_id}/approve", response_model=InvoiceResponse)
async def approve_invoice(
    invoice_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Approve an invoice (admin/accounts only)"""
    user_role = current_user.get("role") if isinstance(current_user, dict) else current_user.role
    if user_role not in ["admin", "accounts"]:
        raise HTTPException(status_code=403, detail="Only admin or accounts can approve invoices")
    repo = InvoiceRepository(db)
    payment_repo = PaymentRepository(db)
    invoice = await repo.get_by_id(invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if invoice.status == "approved":
        raise HTTPException(status_code=400, detail="Invoice already approved")
    # Approve the invoice
    updated = await repo.update(invoice_id, {"status": "approved"})

    # Always create or update payment as pending (never completed)
    payment = await payment_repo.get_by_invoice(invoice_id)
    if payment:
        await payment_repo.update(payment.id, {
            "amount": invoice.amount,
            "status": PaymentStatus.PENDING.value,
            "payment_date": None,
            "vendor_id": invoice.vendor_id
        })
    else:
        new_payment = Payment(
            amount=invoice.amount,
            payment_date=None,
            status=PaymentStatus.PENDING.value,
            invoice_id=invoice.id,
            vendor_id=invoice.vendor_id
        )
        await payment_repo.create(new_payment)

    # Always return a valid invoice object or raise 404
    result = await repo.get_by_id(invoice_id)
    if not result:
        raise HTTPException(status_code=404, detail="Invoice not found after update")
    from app.schemas.invoice import InvoiceResponse
    return InvoiceResponse.from_orm(result)

    # Always create or update payment as pending (never completed)
    payment = await payment_repo.get_by_invoice(invoice_id)
    if payment:
        await payment_repo.update(payment.id, {
            "amount": invoice.amount,
            "status": PaymentStatus.PENDING.value,
            "payment_date": None,
            "vendor_id": invoice.vendor_id
        })
    else:
        new_payment = Payment(
            amount=invoice.amount,
            payment_date=None,
            status=PaymentStatus.PENDING.value,
            invoice_id=invoice.id,
            vendor_id=invoice.vendor_id
        )
        await payment_repo.create(new_payment)
# Mark payment as paid endpoint
from fastapi import Body

@router.post("/{invoice_id}/mark_paid", response_model=InvoiceResponse)
async def mark_invoice_paid(
    invoice_id: int,
    payment_method: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark payment as paid and update invoice status, with payment method"""
    import logging
    logging.basicConfig(level=logging.INFO)
    user_role = current_user.get("role") if isinstance(current_user, dict) else current_user.role
    if user_role not in ["admin", "accounts"]:
        raise HTTPException(status_code=403, detail="Only admin or accounts can mark as paid")
    repo = InvoiceRepository(db)
    payment_repo = PaymentRepository(db)
    logging.info(f"[MARK PAID] invoice_id={invoice_id}")
    invoice = await repo.get_by_id(invoice_id)
    logging.info(f"[MARK PAID] found invoice: {invoice}")
    if not invoice:
        logging.error("Invoice not found")
        raise HTTPException(status_code=404, detail="Invoice not found")
    payment = await payment_repo.get_by_invoice(invoice_id)
    logging.info(f"[MARK PAID] found payment: {payment}")
    if not payment:
        logging.error("Payment not found for invoice")
        raise HTTPException(status_code=404, detail="Payment not found for invoice")
    # Update payment to completed and set payment_method
    await payment_repo.update(payment.id, {
        "status": PaymentStatus.COMPLETED.value,
        "payment_date": date.today(),
        "payment_method": payment_method
    })
    # Update invoice to paid
    await repo.update(invoice_id, {"status": "paid"})
    updated = await repo.get_by_id(invoice_id)
    return updated

    return updated

@router.get("", response_model=List[InvoiceResponse])
async def get_invoices(
    campaign_id: Optional[int] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    repo = InvoiceRepository(db)
    
    user_role = current_user.get("role") if isinstance(current_user, dict) else current_user.role
    user_vendor_id = current_user.get("vendor_id") if isinstance(current_user, dict) else current_user.vendor_id
    vendor_id = user_vendor_id if user_role == "vendor" else None
    
    if vendor_id:
        invoices = await repo.get_by_vendor(vendor_id)
    else:
        invoices = await repo.get_all()
    
    # ✅ VENDOR NAME ASSIGNMENT
    VENDOR_MAP = {
        1: "Recharge Studio",
        # Add more: 2: "ABC Corp", etc.
    }
    
    for invoice in invoices:
        setattr(invoice, 'vendor_name', VENDOR_MAP.get(invoice.vendor_id, f"Vendor ID: {invoice.vendor_id}"))
    
    if campaign_id:
        invoices = [inv for inv in invoices if inv.campaign_id == campaign_id]
    if status:
        invoices = [inv for inv in invoices if inv.status == status]
    
    return invoices

@router.get("/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(
    invoice_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific invoice"""
    repo = InvoiceRepository(db)
    invoice = await repo.get_by_id(invoice_id)
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Check authorization (current_user is dict from JWT)
    user_role = current_user.get("role") if isinstance(current_user, dict) else current_user.role
    user_vendor_id = current_user.get("vendor_id") if isinstance(current_user, dict) else current_user.vendor_id
    if user_role == "vendor" and invoice.vendor_id != user_vendor_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this invoice")
    
    return invoice

@router.post("", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
async def create_invoice(
    invoice: InvoiceCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new invoice - only vendors can create for themselves"""
    import logging
    logging.basicConfig(level=logging.INFO)
    # current_user is dict from JWT
    user_role = current_user.get("role") if isinstance(current_user, dict) else current_user.role
    user_vendor_id = current_user.get("vendor_id") if isinstance(current_user, dict) else current_user.vendor_id

    logging.info(f"[INVOICE CREATE] user_role={user_role}, user_vendor_id={user_vendor_id}, payload={invoice.dict()}")

    if user_role == "vendor":
        if not user_vendor_id:
            logging.error("Vendor user must be linked to a vendor")
            raise HTTPException(status_code=403, detail="Vendor user must be linked to a vendor")
        vendor_id = user_vendor_id
    elif user_role == "admin":
        logging.error("Admin must specify vendor_id")
        raise HTTPException(status_code=400, detail="Admin must specify vendor_id")
    else:
        logging.error("Not authorized to create invoices")
        raise HTTPException(status_code=403, detail="Not authorized to create invoices")

    repo = InvoiceRepository(db)
    invoice_dict = invoice.dict()
    invoice_dict['vendor_id'] = vendor_id

    try:
        new_invoice = Invoice(**invoice_dict)
    except Exception as e:
        logging.error(f"Invoice model error: {e}, invoice_dict={invoice_dict}")
        raise HTTPException(status_code=400, detail=f"Invoice model error: {e}")
    created = await repo.create(new_invoice)
    return created

@router.put("/{invoice_id}", response_model=InvoiceResponse)
async def update_invoice(
    invoice_id: int,
    invoice: InvoiceUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update an invoice"""
    repo = InvoiceRepository(db)
    existing = repo.get_by_id(invoice_id)
    
    if not existing:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Check authorization
    if current_user.role == "vendor" and existing.vendor_id != current_user.vendor_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this invoice")
    
    # Vendors can't change status (only admin can approve/reject)
    if current_user.role == "vendor" and invoice.status:
        raise HTTPException(status_code=403, detail="Vendors cannot change invoice status")
    
    updated = await repo.update(invoice_id, invoice.dict(exclude_unset=True))
    return updated

@router.post("/{invoice_id}/upload", response_model=InvoiceResponse)
async def upload_invoice_file(
    invoice_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload invoice file"""
    repo = InvoiceRepository(db)
    invoice = await repo.get_by_id(invoice_id)
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Check authorization (current_user is dict from JWT)
    user_role = current_user.get("role") if isinstance(current_user, dict) else current_user.role
    user_vendor_id = current_user.get("vendor_id") if isinstance(current_user, dict) else current_user.vendor_id
    if user_role == "vendor" and invoice.vendor_id != user_vendor_id:
        raise HTTPException(status_code=403, detail="Not authorized to upload for this invoice")
    
    # Save file
    upload_dir = Path(__file__).parent.parent.parent / "uploads" / "invoices"
    upload_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    filename = f"{invoice.invoice_number}_{timestamp}_{file.filename}"
    file_path = upload_dir / filename

    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Store only the relative URL path
    url_path = f"/uploads/invoices/{filename}"
    updated = await repo.update(invoice_id, {"invoice_file": url_path})

    # Return updated invoice with url field for frontend
    from app.schemas.invoice import InvoiceResponse
    data = InvoiceResponse.from_orm(updated).dict()
    data["invoice_file_url"] = url_path
    return data

@router.delete("/{invoice_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_invoice(
    invoice_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete an invoice - admin only"""
    user_role = current_user.get("role") if isinstance(current_user, dict) else current_user.role
    if user_role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete invoices")
    
    repo = InvoiceRepository(db)
    await repo.delete(invoice_id)
    return None
