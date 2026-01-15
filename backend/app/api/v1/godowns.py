from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.schemas.godown import (
    GodownCreate, GodownUpdate, GodownResponse, GodownDetailResponse,
    InventoryItemCreate, InventoryItemUpdate, InventoryItemResponse,
    LowStockAlert
)
from app.services.godown_service import GodownService, InventoryService
from app.database.connection import get_db
from app.core.role_permissions import Permission
from app.api.dependencies import require_permission

router = APIRouter(prefix="/godowns", tags=["Godowns"])
inventory_router = APIRouter(prefix="/inventory", tags=["Inventory"])

godown_service = GodownService()
inventory_service = InventoryService()

# ==================== GODOWN ENDPOINTS ====================

@router.post("", response_model=GodownResponse, status_code=status.HTTP_201_CREATED)
async def create_godown(
    godown_data: GodownCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.GODOWN_CREATE))
):
    """Create a new godown (Admin/Godown Manager only)"""
    return await godown_service.create_godown(db, godown_data)


@router.get("", response_model=List[GodownResponse])
async def get_godowns(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.GODOWN_READ))
):
    """Get all godowns (Admin/Godown Manager only)"""
    return await godown_service.get_all_godowns(db)


@router.get("/{godown_id}", response_model=GodownResponse)
async def get_godown(
    godown_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.GODOWN_READ))
):
    """Get godown details (Admin/Godown Manager only). Inventory items fetched separately via /api/v1/inventory/godown/{godown_id}"""
    godown = await godown_service.get_godown(db, godown_id)
    return godown


@router.patch("/{godown_id}", response_model=GodownResponse)
async def update_godown(
    godown_id: int,
    godown_data: GodownUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.GODOWN_UPDATE))
):
    """Update godown (Admin/Godown Manager only)"""
    return await godown_service.update_godown(db, godown_id, godown_data)


@router.delete("/{godown_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_godown(
    godown_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.GODOWN_DELETE))
):
    """Delete godown (soft delete) (Admin/Godown Manager only)"""
    await godown_service.delete_godown(db, godown_id)
    return None


# ==================== INVENTORY ENDPOINTS ====================

@inventory_router.post("", response_model=InventoryItemResponse, status_code=status.HTTP_201_CREATED)
async def create_inventory_item(
    item_data: InventoryItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.INVENTORY_CREATE))
):
    """Create a new inventory item (Admin/Godown Manager only)"""
    return await inventory_service.create_item(db, item_data)


@inventory_router.get("/alerts/low-stock", response_model=List[LowStockAlert])
async def get_low_stock_alerts(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.INVENTORY_READ))
):
    """Get low stock alerts (Admin/Godown Manager only)"""
    return await inventory_service.get_low_stock_items(db)


@inventory_router.get("/godown/{godown_id}", response_model=List[InventoryItemResponse])
async def get_inventory_by_godown(
    godown_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.INVENTORY_READ))
):
    """Get inventory items for a specific godown (Admin/Godown Manager only)"""
    return await inventory_service.get_items_by_godown(db, godown_id)


@inventory_router.get("", response_model=List[InventoryItemResponse])
async def get_inventory_items(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.INVENTORY_READ))
):
    """Get all inventory items (Admin/Godown Manager only)"""
    return await inventory_service.get_all_items(db)


@inventory_router.get("/{item_id}", response_model=InventoryItemResponse)
async def get_inventory_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.INVENTORY_READ))
):
    """Get inventory item details (Admin/Godown Manager only)"""
    return await inventory_service.get_item(db, item_id)


@inventory_router.patch("/{item_id}", response_model=InventoryItemResponse)
async def update_inventory_item(
    item_id: int,
    item_data: InventoryItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.INVENTORY_UPDATE))
):
    """Update inventory item (Admin/Godown Manager only)"""
    return await inventory_service.update_item(db, item_id, item_data)


@inventory_router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_inventory_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.INVENTORY_DELETE))
):
    """Delete inventory item (soft delete) (Admin/Godown Manager only)"""
    await inventory_service.delete_item(db, item_id)
    return None
