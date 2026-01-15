from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.schemas.report import ReportCreate, ReportUpdate, ReportResponse
from app.repositories.report_repo import ReportRepository
from app.database.connection import get_db
from app.core.role_permissions import Permission
from app.api.dependencies import require_permission, get_current_active_user

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.post("", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def create_report(
    report_data: ReportCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.REPORT_CREATE))
):
    """Create a new report"""
    repo = ReportRepository()
    report = await repo.create(db, report_data.model_dump())
    # Fetch the report again with relationships loaded
    report_with_relations = await repo.get_by_id(db, report.id)
    return ReportResponse.model_validate(report_with_relations)

@router.get("", response_model=List[ReportResponse])
async def get_reports(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.REPORT_READ))
):
    """Get all reports"""
    repo = ReportRepository()
    reports = await repo.get_all(db)
    return [ReportResponse.model_validate(r) for r in reports]

@router.get("/campaign/{campaign_id}", response_model=List[ReportResponse])
async def get_campaign_reports(
    campaign_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.REPORT_READ))
):
    """Get reports for a specific campaign"""
    repo = ReportRepository()
    reports = await repo.get_by_campaign(db, campaign_id)
    return [ReportResponse.model_validate(r) for r in reports]

@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(
    report_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.REPORT_READ))
):
    """Get report by ID"""
    repo = ReportRepository()
    report = await repo.get_by_id(db, report_id)
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    return ReportResponse.model_validate(report)

@router.patch("/{report_id}", response_model=ReportResponse)
@router.put("/{report_id}", response_model=ReportResponse)
async def update_report(
    report_id: int,
    report_data: ReportUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.REPORT_UPDATE))
):
    """Update report by ID"""
    repo = ReportRepository()
    
    # Check if report exists
    report = await repo.get_by_id(db, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Update with only provided fields
    updated_report = await repo.update(db, report_id, report_data.model_dump(exclude_unset=True))
    
    if not updated_report:
        raise HTTPException(status_code=404, detail="Report not found after update")
    
    # Fetch again with relationships loaded
    report_with_relations = await repo.get_by_id(db, updated_report.id)
    return ReportResponse.model_validate(report_with_relations)

@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_report(
    report_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.REPORT_DELETE))
):
    """Delete report by ID"""
    repo = ReportRepository()
    
    # Check if report exists
    report = await repo.get_by_id(db, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Delete
    await repo.delete(db, report_id)
    return None
