from enum import Enum
from fastapi import HTTPException, status, Depends
from app.core.security import get_current_user

class UserRole(str, Enum):
    # Existing roles (DO NOT MODIFY)
    ADMIN = "admin"
    CLIENT_SERVICING = "client_servicing"
    OPERATIONS_MANAGER = "operations_manager"
    ACCOUNTS = "accounts"
    VENDOR = "vendor"
    CLIENT = "client"
    
    # New roles (Extension)
    SALES = "sales"
    PURCHASE = "purchase"
    OPERATOR = "operator"
    DRIVER = "driver"
    PROMOTER = "promoter"
    ANCHOR = "anchor"
    VEHICLE_MANAGER = "vehicle_manager"
    GODOWN_MANAGER = "godown_manager"

class Permission:
    """Role-based permission checker"""
    
    @staticmethod
    def require_roles(allowed_roles: list):
        async def role_checker(current_user: dict = Depends(get_current_user)):
            user_role = current_user.get("role")
            # Handle both string roles and enum roles
            allowed_role_values = [role if isinstance(role, str) else role.value for role in allowed_roles]
            
            if user_role not in allowed_role_values:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not enough permissions"
                )
            return current_user
        return role_checker
    
    @staticmethod
    def require_admin():
        return Permission.require_roles([UserRole.ADMIN])
    
    @staticmethod
    def require_operations():
        return Permission.require_roles([UserRole.ADMIN, UserRole.OPERATIONS_MANAGER, UserRole.SALES, UserRole.CLIENT_SERVICING])
    
    @staticmethod
    def require_accounts():
        return Permission.require_roles([UserRole.ADMIN, UserRole.ACCOUNTS])
