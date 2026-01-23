from fastapi import APIRouter, Depends, status, UploadFile, File, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
import os
import shutil
from datetime import datetime
from app.schemas.expense import ExpenseCreate, ExpenseResponse
from app.services.expense_service import ExpenseService
from app.database.connection import get_db
from app.core.role_permissions import Permission
from app.api.dependencies import require_permission, require_any_permission, get_current_active_user

router = APIRouter(prefix="/expenses", tags=["Expenses"])

@router.post("", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
async def create_expense(
    expense_type: str = Form(...),
    amount: float = Form(...),
    campaign_id: Optional[int] = Form(None),
    driver_id: Optional[int] = Form(None),
    description: Optional[str] = Form(None),
    bill_url: Optional[str] = Form(None),
    submitted_date: Optional[str] = Form(None),
    bill_image: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.EXPENSE_CREATE))
):
    """Create a new expense with optional bill image"""
    bill_image_path = None
    
    # Handle bill image upload
    if bill_image:
        # Validate file type
        allowed_types = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
        if bill_image.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Only JPG, PNG, and WEBP images are allowed")
        
        # Validate file size (5MB max)
        file_content = await bill_image.read()
        if len(file_content) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size must be less than 5MB")
        
        # Create uploads directory if it doesn't exist
        upload_dir = "/uploads/expenses"
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_extension = bill_image.filename.split(".")[-1]
        user_id = current_user.get('user_id', 'unknown')
        filename = f"expense_{timestamp}_{user_id}.{file_extension}"
        file_path = os.path.join(upload_dir, filename)
        
        # Save file
        with open(file_path, "wb") as buffer:
            buffer.write(file_content)
        
        bill_image_path = f"/uploads/expenses/{filename}"
    
    # Create expense data
    expense_data = ExpenseCreate(
        expense_type=expense_type,
        amount=amount,
        campaign_id=campaign_id,
        driver_id=driver_id,
        description=description,
        bill_url=bill_url,
        bill_image=bill_image_path,
        submitted_date=submitted_date
    )
    
    service = ExpenseService()
    return await service.create_expense(db, expense_data)

@router.get("", response_model=List[ExpenseResponse])
async def get_expenses(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.EXPENSE_READ))
):
    """Get all expenses"""
    service = ExpenseService()
    return await service.get_all_expenses(db)

@router.patch("/{expense_id}/approve", response_model=ExpenseResponse)
async def approve_expense(
    expense_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.EXPENSE_APPROVE))
):
    """Approve an expense"""
    service = ExpenseService()
    return await service.approve_expense(db, expense_id)

@router.patch("/{expense_id}/reject", response_model=ExpenseResponse)
async def reject_expense(
    expense_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.EXPENSE_APPROVE))
):
    """Reject an expense"""
    service = ExpenseService()
    return await service.reject_expense(db, expense_id)


@router.get("/{expense_id}", response_model=ExpenseResponse)
async def get_expense(
    expense_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.EXPENSE_READ))
):
    """Get expense by ID"""
    service = ExpenseService()
    return await service.get_expense(db, expense_id)


@router.put("/{expense_id}", response_model=ExpenseResponse)
async def update_expense(
    expense_id: int,
    expense_data: ExpenseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.EXPENSE_UPDATE))
):
    """Update an existing expense"""
    service = ExpenseService()
    data = expense_data.model_dump()
    return await service.update_expense(db, expense_id, data)

@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense(
    expense_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.EXPENSE_DELETE))
):
    """Delete expense by ID"""
    service = ExpenseService()
    await service.delete_expense(db, expense_id)
    return None
