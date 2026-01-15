from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.schemas.vendor import VendorCreate, VendorUpdate, VendorResponse
from app.repositories.vendor_repo import VendorRepository
from app.database.connection import get_db
from app.core.role_permissions import Permission
from app.api.dependencies import require_permission, get_current_active_user

router = APIRouter(prefix="/vendors", tags=["Vendors"])

@router.post("", response_model=VendorResponse, status_code=status.HTTP_201_CREATED)
async def create_vendor(
    vendor_data: VendorCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.VENDOR_CREATE))
):
    """Create a new vendor"""
    repo = VendorRepository()
    vendor = await repo.create(db, vendor_data.model_dump())
    created_vendor = await repo.get_by_id(db, vendor.id)
    return VendorResponse.model_validate(created_vendor)

@router.get("", response_model=List[VendorResponse])
async def get_vendors(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.VENDOR_READ))
):
    """Get all vendors"""
    repo = VendorRepository()
    vendors = await repo.get_active_vendors(db)
    return [VendorResponse.model_validate(v) for v in vendors]

@router.get("/{vendor_id}", response_model=VendorResponse)
async def get_vendor(
    vendor_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.VENDOR_READ))
):
    """Get vendor by ID"""
    repo = VendorRepository()
    vendor = await repo.get_by_id(db, vendor_id)
    
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    return VendorResponse.model_validate(vendor)

@router.patch("/{vendor_id}", response_model=VendorResponse)
@router.put("/{vendor_id}", response_model=VendorResponse)
async def update_vendor(
    vendor_id: int,
    vendor_data: VendorUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.VENDOR_UPDATE))
):
    """Update vendor by ID"""
    repo = VendorRepository()
    
    # Check if vendor exists
    vendor = await repo.get_by_id(db, vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    # Update with only provided fields
    updated_vendor = await repo.update(db, vendor_id, vendor_data.model_dump(exclude_unset=True))
    
    if not updated_vendor:
        raise HTTPException(status_code=404, detail="Vendor not found after update")
    
    return VendorResponse.model_validate(updated_vendor)

@router.delete("/{vendor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vendor(
    vendor_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.VENDOR_DELETE))
):
    """Delete vendor by ID (soft delete)"""
    repo = VendorRepository()
    
    # Check if vendor exists
    vendor = await repo.get_by_id(db, vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    # Soft delete
    await repo.delete(db, vendor_id)
    return None
