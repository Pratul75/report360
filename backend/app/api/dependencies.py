"""
API Dependencies for permission checking and authentication
"""
from fastapi import Depends, HTTPException, status
from typing import List, Optional
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import get_current_user
from app.core.permissions import UserRole
from app.core.role_permissions import RolePermissions, Permission
from app.database.connection import get_db


async def check_user_permission(db: AsyncSession, user_role: str, permission_name: str) -> bool:
    """
    Check if a user role has a specific permission by querying the database.
    Falls back to hardcoded RolePermissions if database query fails.
    """
    try:
        # Query database for permission using raw SQL
        query = text("""
            SELECT 1 
            FROM role_permissions rp
            JOIN roles r ON rp.role_id = r.id
            JOIN permissions p ON rp.permission_id = p.id
            WHERE r.name = :role_name AND p.name = :permission_name
            LIMIT 1
        """)
        
        result = await db.execute(query, {"role_name": user_role, "permission_name": permission_name})
        has_db_perm = result.scalar() is not None
        if has_db_perm:
            return True
    except Exception as e:
        pass  # Fall through to hardcoded check
    
    # Fallback to hardcoded permissions
    try:
        user_role_enum = UserRole(user_role)
        permission_enum = Permission(permission_name)
        return RolePermissions.has_permission(user_role_enum, permission_enum)
    except ValueError:
        return False


async def get_current_active_user(current_user: dict = Depends(get_current_user)):
    """Get current active user from JWT token"""
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    return current_user


def require_permission(required_permission: Permission):
    """
    Dependency to check if user has required permission.
    Now checks database first, falls back to hardcoded permissions.
    
    Usage:
        @router.post("/clients")
        async def create_client(
            current_user: dict = Depends(require_permission(Permission.CLIENT_CREATE))
        ):
            ...
    """
    async def permission_checker(
        current_user: dict = Depends(get_current_active_user),
        db: AsyncSession = Depends(get_db)
    ):
        role_str = current_user.get("role")
        if not role_str:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User role not found"
            )
        
        # Check permission in database
        has_perm = await check_user_permission(db, role_str, required_permission.value)
        
        if not has_perm:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required: {required_permission.value}"
            )
        
        return current_user
    
    return permission_checker


def require_any_permission(required_permissions: List[Permission]):
    """
    Dependency to check if user has ANY of the required permissions.
    
    Usage:
        @router.get("/dashboard")
        async def get_dashboard(
            current_user: dict = Depends(require_any_permission([
                Permission.DASHBOARD_VIEW,
                Permission.DASHBOARD_ANALYTICS
            ]))
        ):
            ...
    """
    async def permission_checker(current_user: dict = Depends(get_current_active_user)):
        role_str = current_user.get("role")
        if not role_str:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User role not found"
            )
        
        try:
            user_role = UserRole(role_str)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Invalid role: {role_str}"
            )
        
        has_any_permission = any(
            RolePermissions.has_permission(user_role, perm) 
            for perm in required_permissions
        )
        
        if not has_any_permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required any of: {[p.value for p in required_permissions]}"
            )
        
        return current_user
    
    return permission_checker


def require_role(allowed_roles: List[UserRole]):
    """
    Dependency to check if user has one of the allowed roles.
    
    Usage:
        @router.post("/users")
        async def create_user(
            current_user: dict = Depends(require_role([UserRole.ADMIN]))
        ):
            ...
    """
    async def role_checker(current_user: dict = Depends(get_current_active_user)):
        role_str = current_user.get("role")
        if not role_str:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User role not found"
            )
        
        try:
            user_role = UserRole(role_str)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Invalid role: {role_str}"
            )
        
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {[r.value for r in allowed_roles]}"
            )
        
        return current_user
    
    return role_checker


def is_admin(current_user: dict = Depends(get_current_active_user)):
    """
    Dependency to check if user is admin.
    
    Usage:
        @router.delete("/users/{user_id}")
        async def delete_user(
            user_id: int,
            current_user: dict = Depends(is_admin)
        ):
            ...
    """
    role_str = current_user.get("role")
    if role_str != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user
