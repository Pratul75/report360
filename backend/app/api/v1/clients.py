from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.schemas.client import ClientCreate, ClientUpdate, ClientResponse
from app.repositories.client_repo import ClientRepository
from app.services.client_service import ClientService
from app.core.role_permissions import Permission
from app.database.connection import get_db
from app.api.dependencies import require_permission, get_current_active_user
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/clients", tags=["Clients"])

@router.post("", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
async def create_client(
    client_data: ClientCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.CLIENT_CREATE))
):
    """Create a new client"""
    repo = ClientRepository()
    client = await repo.create(db, client_data.model_dump())
    
    # Refresh to get the created client with relationships loaded
    created_client = await repo.get_by_id(db, client.id)
    return ClientResponse.model_validate(created_client)

@router.get("", response_model=List[ClientResponse])
async def get_clients(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.CLIENT_READ))
):
    """Get all clients"""
    repo = ClientRepository()
    clients = await repo.get_active_clients(db)
    return [ClientResponse.model_validate(c) for c in clients]

@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(
    client_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.CLIENT_READ))
):
    """Get client by ID"""
    repo = ClientRepository()
    client = await repo.get_by_id(db, client_id)
    
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    return ClientResponse.model_validate(client)

@router.patch("/{client_id}", response_model=ClientResponse)
@router.put("/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: int,
    client_data: ClientUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.CLIENT_UPDATE))
):
    """Update client by ID"""
    repo = ClientRepository()
    
    # Check if client exists
    client = await repo.get_by_id(db, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Update with only provided fields
    updated_client = await repo.update(db, client_id, client_data.model_dump(exclude_unset=True))
    
    if not updated_client:
        raise HTTPException(status_code=404, detail="Client not found after update")
    
    return ClientResponse.model_validate(updated_client)

@router.delete("/{client_id}", status_code=status.HTTP_200_OK)
async def delete_client(
    client_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.CLIENT_DELETE))
):
    """
    SAFE DELETE: Delete client and ALL related data (soft delete with cascade)
    
    This endpoint performs a SAFE CASCADE SOFT-DELETE operation:
    - Soft deletes the client (is_active=0)
    - Soft deletes all projects under this client
    - Soft deletes all campaigns under these projects
    - Soft deletes all expenses, reports, invoices, activities under these campaigns
    
    This is a TRANSACTION-BASED operation - either everything succeeds or nothing changes.
    
    SECURITY: Admin/authorized users only
    
    Returns:
        Deletion summary with counts of affected records
    """
    logger.info(f"🗑️ Delete request for Client ID: {client_id} by user: {current_user.get('email')}")
    
    try:
        # Use ClientService for safe cascade delete
        result = await ClientService.safe_delete_client(db, client_id)
        
        logger.info(f"✅ Successfully deleted Client ID: {client_id}")
        return result
        
    except ValueError as e:
        logger.warning(f"⚠️ Client not found: {str(e)}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"❌ Error deleting Client ID {client_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete client: {str(e)}")


@router.get("/{client_id}/deletion-preview")
async def get_deletion_preview(
    client_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.CLIENT_DELETE))
):
    """
    Preview what will be deleted if we delete this client
    
    Shows counts of all related entities that will be affected.
    Useful for confirmation dialogs before actual deletion.
    
    Returns:
        Preview with counts of projects, campaigns, and all related data
    """
    try:
        preview = await ClientService.get_client_deletion_preview(db, client_id)
        return preview
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get preview: {str(e)}")
