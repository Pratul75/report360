from fastapi import (
    APIRouter,
    Depends,
    UploadFile,
    File,
    Form,
    HTTPException,
    status
)
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from pathlib import Path
import shutil
from datetime import datetime
from sqlalchemy import select

from app.database.connection import get_db
from app.repositories.driver_repo import DriverRepository
from app.services.driver_service import DriverService
from app.schemas.driver import DriverCreate, DriverUpdate, DriverResponse, ToggleDriverStatusRequest
from app.models.driver import Driver
from app.core.role_permissions import Permission
from app.api.dependencies import require_permission, get_current_active_user

# -------------------------------------------------------------------
# Router
# -------------------------------------------------------------------
router = APIRouter(prefix="/drivers", tags=["Drivers"])

# -------------------------------------------------------------------
# Upload directory
# -------------------------------------------------------------------
DRIVERS_UPLOAD_DIR = Path("/uploads/drivers")
DRIVERS_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# -------------------------------------------------------------------
# Create Driver
# -------------------------------------------------------------------
@router.post(
    "",
    response_model=DriverResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_driver(
    driver_data: DriverCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.DRIVER_CREATE))
):
    """
    Create a new driver and automatically create a user account if email is provided
    
    Note: User account creation is automatic when email is provided in driver data
    """
    service = DriverService()
    driver = await service.create_driver_with_user(db, driver_data.model_dump())
    return DriverResponse.model_validate(driver)

# -------------------------------------------------------------------
# Get All Drivers
# Vendors see only their own drivers
# -------------------------------------------------------------------
@router.get("", response_model=List[DriverResponse])
async def get_drivers(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.DRIVER_READ))
):
    repo = DriverRepository()

    user_role = current_user.get("role")
    vendor_id = current_user.get("vendor_id")

    if user_role == "vendor":
        if not vendor_id:
            raise HTTPException(
                status_code=403,
                detail="Vendor user must be linked to a vendor"
            )
        drivers = await repo.get_by_vendor_async(db, vendor_id)
    else:
        # Admin and other roles should see all drivers (both active and inactive)
        drivers = await repo.get_all_async(db)

    return [DriverResponse.model_validate(d) for d in drivers]

# -------------------------------------------------------------------
# Get Driver By ID
# -------------------------------------------------------------------
@router.get("/{driver_id}", response_model=DriverResponse)
async def get_driver(
    driver_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.DRIVER_READ))
):
    repo = DriverRepository()
    driver = await repo.get_by_id(db, driver_id)

    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    # Vendor isolation
    if current_user["role"] == "vendor":
        if driver.vendor_id != current_user.get("vendor_id"):
            raise HTTPException(status_code=403, detail="Access denied")

    return DriverResponse.model_validate(driver)

# -------------------------------------------------------------------
# Update Driver
# -------------------------------------------------------------------
@router.put("/{driver_id}", response_model=DriverResponse)
@router.patch("/{driver_id}", response_model=DriverResponse)
async def update_driver(
    driver_id: int,
    driver_data: DriverUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.DRIVER_UPDATE))
):
    repo = DriverRepository()
    driver = await repo.get_by_id(db, driver_id)

    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    if current_user["role"] == "vendor":
        if driver.vendor_id != current_user.get("vendor_id"):
            raise HTTPException(status_code=403, detail="Access denied")

    updated_driver = await repo.update(
        db,
        driver_id,
        driver_data.model_dump(exclude_unset=True)
    )

    return DriverResponse.model_validate(updated_driver)

# -------------------------------------------------------------------
# Delete Driver (Soft Delete)
# -------------------------------------------------------------------
@router.delete("/{driver_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_driver(
    driver_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.DRIVER_DELETE))
):
    repo = DriverRepository()
    driver = await repo.get_by_id(db, driver_id)

    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    if current_user["role"] == "vendor":
        if driver.vendor_id != current_user.get("vendor_id"):
            raise HTTPException(status_code=403, detail="Access denied")

    await repo.delete(db, driver_id)
    return None

# -------------------------------------------------------------------
# Upload Driver License Image
# -------------------------------------------------------------------
@router.post(
    "/{driver_id}/upload-license",
    status_code=status.HTTP_200_OK
)
async def upload_driver_license_image(
    driver_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.DRIVER_UPDATE))
):
    # Validate image
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files allowed")

    # Fetch driver
    result = await db.execute(
        select(Driver).where(
            Driver.id == driver_id,
            Driver.is_active == True
        )
    )
    driver = result.scalar_one_or_none()

    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    # Vendor isolation
    if current_user["role"] == "vendor":
        if driver.vendor_id != current_user.get("vendor_id"):
            raise HTTPException(
                status_code=403,
                detail="You cannot upload image for another vendor's driver"
            )

    # Generate filename
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    ext = Path(file.filename).suffix
    filename = f"driver_license_{driver_id}_{timestamp}{ext}"
    file_path = DRIVERS_UPLOAD_DIR / filename

    # Save file
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Save path in DB
    driver.license_image = f"/uploads/drivers/{filename}"
    driver.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(driver)

    return {
        "success": True,
        "driver_id": driver_id,
        "license_image": driver.license_image
    }

# -------------------------------------------------------------------
# Toggle Driver Status (Active/Inactive)
# -------------------------------------------------------------------
@router.patch("/{driver_id}/toggle-status", response_model=DriverResponse)
async def toggle_driver_status(
    driver_id: int,
    status_data: ToggleDriverStatusRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.DRIVER_UPDATE))
):
    """
    Toggle driver active/inactive status with optional reason
    
    - Vendors can only toggle their own drivers
    - Admins can toggle any driver
    """
    repo = DriverRepository()
    driver = await repo.get_by_id(db, driver_id)

    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    # Vendor isolation - vendors can only toggle their own drivers
    if current_user["role"] == "vendor":
        if driver.vendor_id != current_user.get("vendor_id"):
            raise HTTPException(
                status_code=403,
                detail="You cannot modify another vendor's driver"
            )

    # Update status
    driver.is_active = status_data.is_active
    
    # Only set inactive_reason when deactivating
    if not status_data.is_active:
        driver.inactive_reason = status_data.inactive_reason or "Deactivated"
    else:
        driver.inactive_reason = None  # Clear reason when reactivating
    
    driver.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(driver)

    return DriverResponse.model_validate(driver)
