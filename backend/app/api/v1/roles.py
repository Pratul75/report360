from fastapi import APIRouter, Depends
from typing import List, Dict
from app.core.security import get_current_user
from app.core.permissions import UserRole
from app.core.role_permissions import RolePermissions, MENU_VISIBILITY

router = APIRouter(prefix="/roles", tags=["Roles & Permissions"])

@router.get("/all")
async def get_all_roles():
    """Get all available roles (public endpoint)"""
    return sorted([role.value for role in UserRole])

@router.get("/permissions")
async def get_all_permissions():
    """Get permissions matrix for all roles (public endpoint)"""
    all_permissions = {}
    for role_str, permissions in RolePermissions.ROLE_PERMISSIONS.items():
        # role_str is already a string, permissions is List[Permission]
        all_permissions[role_str] = [perm.value for perm in permissions]
    return all_permissions

@router.get("/menu")
async def get_all_menus():
    """Get menu visibility for all roles (public endpoint)"""
    # MENU_VISIBILITY already has string keys
    return MENU_VISIBILITY

@router.get("/my-permissions")
async def get_current_user_permissions(
    current_user: dict = Depends(get_current_user)
):
    """Get permissions for the current logged-in user"""
    role_value = current_user.get("role")
    role = UserRole(role_value)
    permissions = RolePermissions.get_permissions(role)
    menu_items = MENU_VISIBILITY.get(role, ["dashboard"])
    
    return {
        "role": role_value,
        "permissions": [perm.value for perm in permissions],
        "menu_visibility": menu_items
    }

@router.get("/my-menu")
async def get_user_menu(
    current_user: dict = Depends(get_current_user)
):
    """Get menu items visible to current user"""
    role_value = current_user.get("role")
    role = UserRole(role_value)
    menu_items = MENU_VISIBILITY.get(role, ["dashboard"])
    
    return {
        "role": role_value,
        "menu_items": menu_items
    }
