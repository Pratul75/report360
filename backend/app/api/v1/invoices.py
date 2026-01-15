from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.database.connection import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.repositories.invoice_repo import InvoiceRepository
from app.schemas.invoice import InvoiceCreate, InvoiceUpdate, InvoiceResponse
from app.models.invoice import Invoice
import os
import shutil
from datetime import datetime

router = APIRouter(prefix="/invoices", tags=["invoices"])

@router.get("", response_model=List[InvoiceResponse])
async def get_invoices(
    campaign_id: Optional[int] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get invoices - vendors see only their own, admins see all"""
    repo = InvoiceRepository(db)
    
    # Get vendor_id if user is a vendor (current_user is dict from JWT)
    user_role = current_user.get("role") if isinstance(current_user, dict) else current_user.role
    user_vendor_id = current_user.get("vendor_id") if isinstance(current_user, dict) else current_user.vendor_id
    vendor_id = user_vendor_id if user_role == "vendor" else None
    
    if vendor_id:
        # Vendor can only see their own invoices
        invoices = await repo.get_by_vendor(vendor_id)
    else:
        # Admin sees all
        invoices = await repo.get_all()
    
    # Apply filters
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
    # current_user is dict from JWT
    user_role = current_user.get("role") if isinstance(current_user, dict) else current_user.role
    user_vendor_id = current_user.get("vendor_id") if isinstance(current_user, dict) else current_user.vendor_id
    
    if user_role == "vendor":
        if not user_vendor_id:
            raise HTTPException(status_code=403, detail="Vendor user must be linked to a vendor")
        vendor_id = user_vendor_id
    elif user_role == "admin":
        # Admin must specify vendor_id in request (add to schema if needed)
        raise HTTPException(status_code=400, detail="Admin must specify vendor_id")
    else:
        raise HTTPException(status_code=403, detail="Not authorized to create invoices")
    
    repo = InvoiceRepository(db)
    invoice_dict = invoice.dict()
    invoice_dict['vendor_id'] = vendor_id
    
    new_invoice = Invoice(**invoice_dict)
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
    upload_dir = "/app/backend/uploads/invoices"
    os.makedirs(upload_dir, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    filename = f"{invoice.invoice_number}_{timestamp}_{file.filename}"
    file_path = os.path.join(upload_dir, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Update invoice with file path
    updated = await repo.update(invoice_id, {"invoice_file": file_path})
    return updated

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
