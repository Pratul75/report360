from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse
from app.repositories.project_repo import ProjectRepository
from app.database.connection import get_db
from app.core.role_permissions import Permission
from app.core.permissions import UserRole
from app.api.dependencies import require_permission, get_current_active_user

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.PROJECT_CREATE))
):
    """Create a new project"""
    repo = ProjectRepository()
    data = project_data.model_dump()
    # Use status from payload if provided, else default to 'active'
    if not data.get("status"):
        data["status"] = "active"
    project = await repo.create(db, data)
    
    # Refresh to get the created project with relationships loaded
    created_project = await repo.get_by_id(db, project.id)
    return ProjectResponse.model_validate(created_project)

@router.get("", response_model=List[ProjectResponse])
async def get_projects(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.PROJECT_READ))
):
    """
    Get projects based on user role:
    - Admin/Sales/Operations: Get all projects
    - Client Servicing: Get only projects assigned to this user
    """
    repo = ProjectRepository()
    
    # Get user role
    user_role = current_user.get("role")
    user_id = current_user.get("sub") or current_user.get("user_id")
    
    # If CS user, filter by assigned_cs
    if user_role == UserRole.CLIENT_SERVICING:
        projects = await repo.get_by_assigned_cs(db, user_id)
    else:
        projects = await repo.get_all(db)
    
    return [ProjectResponse.model_validate(p) for p in projects]

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.PROJECT_READ))
):
    """
    Get project by ID with role-based access:
    - Admin: Can view any project
    - Client Servicing: Can only view projects assigned to them
    - Others: Can view any project
    """
    repo = ProjectRepository()
    project = await repo.get_by_id(db, project_id)
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check if CS user trying to access unassigned project
    user_role = current_user.get("role")
    user_id = current_user.get("sub") or current_user.get("user_id")
    
    if user_role == UserRole.CLIENT_SERVICING:
        if project.assigned_cs != user_id:
            raise HTTPException(
                status_code=403,
                detail="You are not authorized to view this project"
            )
    
    return ProjectResponse.model_validate(project)

@router.patch("/{project_id}", response_model=ProjectResponse)
@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.PROJECT_UPDATE))
):
    """
    Update project with role-based access:
    - Admin: Can update any project
    - Client Servicing: Can only update projects assigned to them
    - Others: Can update any project
    """
    repo = ProjectRepository()
    
    # Check if project exists
    project = await repo.get_by_id(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check if CS user trying to update unassigned project
    user_role = current_user.get("role")
    user_id = current_user.get("sub") or current_user.get("user_id")
    
    if user_role == UserRole.CLIENT_SERVICING:
        if project.assigned_cs != user_id:
            raise HTTPException(
                status_code=403,
                detail="You are not authorized to update this project"
            )
    
    # Update with only provided fields
    updated_project = await repo.update(db, project_id, project_data.model_dump(exclude_unset=True))
    
    if not updated_project:
        raise HTTPException(status_code=404, detail="Project not found after update")
    
    return ProjectResponse.model_validate(updated_project)

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.PROJECT_DELETE))
):
    """Delete project by ID (soft delete)"""
    repo = ProjectRepository()
    
    # Check if project exists
    project = await repo.get_by_id(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Soft delete
    await repo.delete(db, project_id)
    return None
