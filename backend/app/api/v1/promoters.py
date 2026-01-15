from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.schemas.promoter import PromoterCreate, PromoterUpdate, PromoterResponse
from app.repositories.promoter_repo import PromoterRepository
from app.core.security import get_current_user
from app.database.connection import get_db
from app.core.permissions import Permission

router = APIRouter(prefix="/promoters", tags=["Promoters"])

@router.post("", response_model=PromoterResponse, status_code=status.HTTP_201_CREATED)
async def create_promoter(
    promoter_data: PromoterCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(Permission.require_operations())
):
    """Create a new promoter"""
    repo = PromoterRepository()
    promoter = await repo.create(db, promoter_data.model_dump())
    created_promoter = await repo.get_by_id(db, promoter.id)
    return PromoterResponse.model_validate(created_promoter)

@router.get("", response_model=List[PromoterResponse])
async def get_promoters(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all active promoters"""
    repo = PromoterRepository()
    promoters = await repo.get_active_promoters(db)
    return [PromoterResponse.model_validate(p) for p in promoters]

@router.get("/specialty/{specialty}", response_model=List[PromoterResponse])
async def get_promoters_by_specialty(
    specialty: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get promoters by specialty"""
    repo = PromoterRepository()
    promoters = await repo.get_by_specialty(db, specialty)
    return [PromoterResponse.model_validate(p) for p in promoters]

@router.get("/language/{language}", response_model=List[PromoterResponse])
async def get_promoters_by_language(
    language: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get promoters by language"""
    repo = PromoterRepository()
    promoters = await repo.get_by_language(db, language)
    return [PromoterResponse.model_validate(p) for p in promoters]

@router.get("/{promoter_id}", response_model=PromoterResponse)
async def get_promoter(
    promoter_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get promoter by ID"""
    repo = PromoterRepository()
    promoter = await repo.get_by_id(db, promoter_id)
    if not promoter:
        raise HTTPException(status_code=404, detail="Promoter not found")
    return PromoterResponse.model_validate(promoter)

@router.patch("/{promoter_id}", response_model=PromoterResponse)
async def update_promoter(
    promoter_id: int,
    promoter_data: PromoterUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(Permission.require_operations())
):
    """Update promoter"""
    repo = PromoterRepository()
    
    promoter = await repo.get_by_id(db, promoter_id)
    if not promoter:
        raise HTTPException(status_code=404, detail="Promoter not found")
    
    update_dict = promoter_data.model_dump(exclude_unset=True)
    updated_promoter = await repo.update(db, promoter_id, update_dict)
    return PromoterResponse.model_validate(updated_promoter)

@router.delete("/{promoter_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_promoter(
    promoter_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(Permission.require_operations())
):
    """Soft delete promoter"""
    repo = PromoterRepository()
    
    promoter = await repo.get_by_id(db, promoter_id)
    if not promoter:
        raise HTTPException(status_code=404, detail="Promoter not found")
    
    await repo.delete(db, promoter_id)
    return None
