from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.schemas.vehicle import VehicleCreate, VehicleUpdate, VehicleResponse
from app.repositories.vehicle_repo import VehicleRepository
from app.database.connection import get_db
from app.core.role_permissions import Permission
from app.api.dependencies import require_permission, get_current_active_user

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])

@router.post("", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
async def create_vehicle(
    vehicle_data: VehicleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.VEHICLE_CREATE))
):
    """Create a new vehicle"""
    repo = VehicleRepository()
    vehicle = await repo.create(db, vehicle_data.model_dump())
    created_vehicle = await repo.get_by_id(db, vehicle.id)
    return VehicleResponse.model_validate(created_vehicle)

@router.get("", response_model=List[VehicleResponse])
async def get_vehicles(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.VEHICLE_READ))
):
    """Get all vehicles (vendors see only their own)"""
    repo = VehicleRepository()
    
    # Check if user is vendor - filter by their vendor_id
    user_role = current_user.get("role")
    user_vendor_id = current_user.get("vendor_id")
    
    if user_role == "vendor":
        # Vendor users see only their own vehicles
        if not user_vendor_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Vendor user must be linked to a vendor"
            )
        vehicles = await repo.get_by_vendor_async(db, user_vendor_id)
    else:
        # Admin and other roles see all vehicles
        vehicles = await repo.get_active_vehicles(db)
    
    return [VehicleResponse.model_validate(v) for v in vehicles]

@router.get("/{vehicle_id}", response_model=VehicleResponse)
async def get_vehicle(
    vehicle_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.VEHICLE_READ))
):
    """Get vehicle by ID"""
    repo = VehicleRepository()
    vehicle = await repo.get_by_id(db, vehicle_id)
    
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    return VehicleResponse.model_validate(vehicle)

@router.patch("/{vehicle_id}", response_model=VehicleResponse)
@router.put("/{vehicle_id}", response_model=VehicleResponse)
async def update_vehicle(
    vehicle_id: int,
    vehicle_data: VehicleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.VEHICLE_UPDATE))
):
    """Update vehicle by ID"""
    repo = VehicleRepository()
    
    # Check if vehicle exists
    vehicle = await repo.get_by_id(db, vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    # Update with only provided fields
    updated_vehicle = await repo.update(db, vehicle_id, vehicle_data.model_dump(exclude_unset=True))
    
    if not updated_vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found after update")
    
    return VehicleResponse.model_validate(updated_vehicle)

@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vehicle(
    vehicle_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.VEHICLE_DELETE))
):
    """Delete vehicle by ID (soft delete)"""
    repo = VehicleRepository()
    
    # Check if vehicle exists
    vehicle = await repo.get_by_id(db, vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    # Soft delete
    await repo.delete(db, vehicle_id)
    return None
