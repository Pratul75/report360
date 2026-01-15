from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from pathlib import Path
import shutil
import uuid
from datetime import date

from app.schemas.promoter_activity import (
    PromoterActivityCreate,
    PromoterActivityUpdate,
    PromoterActivityResponse,
    PromoterActivityFilter,
    PromoterActivityStats,
    PromoterActivityImageUpdate
)
from app.repositories.promoter_activity_repo import PromoterActivityRepository
from app.database.connection import get_db
from app.core.security import get_current_user
from app.api.dependencies import require_permission, get_current_active_user, Permission
from app.core.logging import logger

router = APIRouter(prefix="/promoter-activities", tags=["Promoter Activities"])

# Image upload configuration
UPLOAD_DIR = Path("/app/backend/uploads/promoter_activities")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

def validate_image(file: UploadFile) -> bool:
    """Validate image file type and size"""
    if not file.filename:
        return False
    
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    return True

async def save_image(file: UploadFile, activity_id: int, image_type: str) -> str:
    """Save uploaded image and return file path"""
    validate_image(file)
    
    # Create directory for this activity
    activity_dir = UPLOAD_DIR / str(activity_id)
    activity_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate filename: {image_type}_{uuid}.{ext}
    ext = Path(file.filename).suffix.lower()
    filename = f"{image_type}_{uuid.uuid4().hex[:8]}{ext}"
    file_path = activity_dir / filename
    
    # Save file
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Return relative path for storage
    return f"/uploads/promoter_activities/{activity_id}/{filename}"

@router.post("", response_model=PromoterActivityResponse, status_code=status.HTTP_201_CREATED)
async def create_activity(
    activity_data: PromoterActivityCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.PROMOTER_ACTIVITY_CREATE))
):
    """
    Create a new promoter activity record
    Requires PROMOTER_ACTIVITY_CREATE permission (promoter, operations, admin)
    """
    repo = PromoterActivityRepository()
    
    # Add created_by
    data = activity_data.model_dump()
    data['created_by_id'] = current_user['user_id']
    
    # Validate numeric fields
    if data.get('people_attended', 0) < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="people_attended cannot be negative"
        )
    if data.get('activity_count', 0) < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="activity_count cannot be negative"
        )
    
    activity = await repo.create(db, data)
    logger.info(f"Created promoter activity ID={activity.id} by user={current_user['email']}")
    
    return PromoterActivityResponse.model_validate(activity)

@router.get("", response_model=List[PromoterActivityResponse])
async def get_activities(
    campaign_id: Optional[int] = None,
    promoter_id: Optional[int] = None,
    village_name: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    language: Optional[str] = None,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.PROMOTER_ACTIVITY_READ))
):
    """
    Get promoter activities with optional filters
    Requires PROMOTER_ACTIVITY_READ permission
    """
    repo = PromoterActivityRepository()
    activities = await repo.get_filtered_activities(
        db,
        campaign_id=campaign_id,
        promoter_id=promoter_id,
        village_name=village_name,
        date_from=date_from,
        date_to=date_to,
        language=language,
        limit=limit
    )
    
    return [PromoterActivityResponse.model_validate(a) for a in activities]

@router.get("/stats", response_model=PromoterActivityStats)
async def get_activity_stats(
    campaign_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.PROMOTER_ACTIVITY_READ))
):
    """Get aggregated statistics for promoter activities"""
    repo = PromoterActivityRepository()
    stats = await repo.get_activity_stats(db, campaign_id=campaign_id)
    return PromoterActivityStats(**stats)

@router.get("/{activity_id}", response_model=PromoterActivityResponse)
async def get_activity(
    activity_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.PROMOTER_ACTIVITY_READ))
):
    """Get single activity by ID with campaign info"""
    repo = PromoterActivityRepository()
    activity = await repo.get_with_campaign_info(db, activity_id)
    
    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Promoter activity not found"
        )
    
    return PromoterActivityResponse.model_validate(activity)

@router.patch("/{activity_id}", response_model=PromoterActivityResponse)
async def update_activity(
    activity_id: int,
    activity_data: PromoterActivityUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.PROMOTER_ACTIVITY_UPDATE))
):
    """
    Update promoter activity
    Requires PROMOTER_ACTIVITY_UPDATE permission (admin only)
    """
    repo = PromoterActivityRepository()
    
    # Check if exists
    existing = await repo.get_by_id(db, activity_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Promoter activity not found"
        )
    
    # Validate numeric fields if provided
    update_data = activity_data.model_dump(exclude_unset=True)
    if 'people_attended' in update_data and update_data['people_attended'] < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="people_attended cannot be negative"
        )
    if 'activity_count' in update_data and update_data['activity_count'] < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="activity_count cannot be negative"
        )
    
    updated = await repo.update(db, activity_id, update_data)
    logger.info(f"Updated promoter activity ID={activity_id} by user={current_user['email']}")
    
    return PromoterActivityResponse.model_validate(updated)

@router.put("/{activity_id}", response_model=PromoterActivityResponse)
async def update_activity_put(
    activity_id: int,
    activity_data: PromoterActivityUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.CAMPAIGN_UPDATE))
):
    """PUT endpoint for activity update (frontend compatibility)"""
    return await update_activity(activity_id, activity_data, db, current_user)

@router.post("/{activity_id}/upload-image")
async def upload_activity_image(
    activity_id: int,
    image_type: str = Form(..., regex="^(before|during|after)$"),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.CAMPAIGN_UPDATE))
):
    """
    Upload image for activity (before/during/after)
    image_type must be: 'before', 'during', or 'after'
    """
    repo = PromoterActivityRepository()
    
    # Check if activity exists
    activity = await repo.get_by_id(db, activity_id)
    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Promoter activity not found"
        )
    
    # Validate and save image
    try:
        image_path = await save_image(file, activity_id, image_type)
        
        # Update activity with image path
        update_data = {f"{image_type}_image": image_path}
        await repo.update(db, activity_id, update_data)
        
        logger.info(f"Uploaded {image_type} image for activity ID={activity_id}")
        
        return {
            "message": f"{image_type.capitalize()} image uploaded successfully",
            "image_path": image_path
        }
    
    except Exception as e:
        logger.error(f"Image upload failed for activity ID={activity_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image upload failed: {str(e)}"
        )

@router.delete("/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_activity(
    activity_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.CAMPAIGN_DELETE))
):
    """
    Soft delete promoter activity
    Requires CAMPAIGN_DELETE permission (admin only)
    """
    repo = PromoterActivityRepository()
    
    activity = await repo.get_by_id(db, activity_id)
    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Promoter activity not found"
        )
    
    await repo.delete(db, activity_id)
    logger.info(f"Deleted promoter activity ID={activity_id} by user={current_user['email']}")
    
    return None
