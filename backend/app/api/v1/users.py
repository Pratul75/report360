from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.schemas.user import UserCreate, UserUpdate, UserResponse, UserListResponse, UserRegistration, PasswordSetRequest
from app.repositories.user_repo import UserRepository
from app.core.security import get_current_user, get_password_hash
from app.core.permissions import UserRole
from app.core.role_permissions import Permission
from app.core.config import settings
from app.database.connection import get_db
from app.api.dependencies import is_admin, require_permission, get_current_active_user

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_data: UserRegistration,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(is_admin)
):
    """
    Register a new user (ADMIN ONLY)
    
    Security Rules:
    - Password is hashed using bcrypt before storage
    - Original password stored in password_hint for admin reference
    - Only admin can access this endpoint (403 for non-admin)
    - Email uniqueness validated
    - Password confirmation validated by Pydantic
    """
    repo = UserRepository()
    
    # Check if user with email already exists
    existing_user = await repo.get_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=400, 
            detail="Email already registered. Please use a different email address."
        )
    
    # Prepare user data
    user_dict = user_data.model_dump(exclude={'confirm_password'})
    plain_password = user_dict.pop('password')
    
    # CRITICAL: Hash password before storage (bcrypt)
    user_dict['password_hash'] = get_password_hash(plain_password)
    
    # Store plain password in password_hint (for admin reference only)
    user_dict['password_hint'] = plain_password
    
    # Handle conditional fields
    if user_data.role != UserRole.VENDOR:
        user_dict.pop('vendor_id', None)
    
    # Create user
    user = await repo.create(db, user_dict)
    return UserResponse.model_validate(user)

@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.USER_CREATE))
):
    """Create a new user (Admin only)"""
    repo = UserRepository()
    
    # Check if user with email already exists
    existing_user = await repo.get_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash the password
    user_dict = user_data.model_dump()
    plain_password = user_dict.pop('password')
    user_dict['password_hash'] = get_password_hash(plain_password)
    
    # WARNING: TESTING/DEMO ONLY - Store plain password if enabled
    if settings.STORE_PLAIN_PASSWORD:
        user_dict['raw_password'] = plain_password
    
    user = await repo.create(db, user_dict)
    return UserResponse.model_validate(user)

@router.get("", response_model=List[UserListResponse])
async def get_users(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.USER_READ))
):
    """Get all active users"""
    repo = UserRepository()
    users = await repo.get_active_users(db)
    return [UserListResponse.model_validate(u) for u in users]

@router.get("/role/{role}", response_model=List[UserListResponse])
async def get_users_by_role(
    role: UserRole,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(is_admin)
):
    """Get users by role (Admin only)"""
    repo = UserRepository()
    users = await repo.get_by_role(db, role)
    return [UserListResponse.model_validate(u) for u in users]

@router.get("/cs-users/list", response_model=List[UserListResponse])
async def get_cs_users(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.PROJECT_CREATE))
):
    """
    Get all active Client Servicing (CS) users
    Used for CS assignment dropdown in project creation
    """
    repo = UserRepository()
    users = await repo.get_by_role(db, UserRole.CLIENT_SERVICING)
    # Filter to only active users
    active_users = [u for u in users if u.is_active]
    return [UserListResponse.model_validate(u) for u in active_users]

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Get user by ID"""
    repo = UserRepository()
    user = await repo.get_by_id(db, user_id)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Non-admin users can only view their own profile
    if current_user["role"] != "admin" and current_user["sub"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this user")
    
    return UserResponse.model_validate(user)

@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.USER_UPDATE))
):
    """Update user (Admin only)"""
    repo = UserRepository()
    
    user = await repo.get_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prepare update dictionary - NO PASSWORD UPDATES ALLOWED
    update_dict = user_data.model_dump(exclude_unset=True)
    
    # Prevent password changes through this endpoint
    if 'password' in update_dict:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Password changes are not allowed through this endpoint. Contact system administrator."
        )
    
    # If email is being updated, check for duplicates
    if 'email' in update_dict and update_dict['email'] and update_dict['email'] != user.email:
        existing_user = await repo.get_by_email(db, update_dict['email'])
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    # If nothing to update, return current user
    if not update_dict:
        return UserResponse.model_validate(user)
    
    updated_user = await repo.update(db, user_id, update_dict)
    if not updated_user:
        raise HTTPException(status_code=500, detail="Failed to update user")
    return UserResponse.model_validate(updated_user)

@router.post("/{user_id}/set-password", response_model=UserResponse)
async def set_user_password(
    user_id: int,
    password_data: PasswordSetRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.USER_PASSWORD_SET))
):
    """Set user password (Admin only - for password management)"""
    repo = UserRepository()
    
    user = await repo.get_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get new password from validated request
    new_password = password_data.password
    
    # Hash the new password
    hashed_password = get_password_hash(new_password)
    
    # Update both password_hash and password_hint
    update_dict = {
        "password_hash": hashed_password,
        "password_hint": new_password  # Store plain password in hint for admin reference
    }
    
    updated_user = await repo.update(db, user_id, update_dict)
    if not updated_user:
        raise HTTPException(status_code=500, detail="Failed to update password")
    return UserResponse.model_validate(updated_user)

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission(Permission.USER_DELETE))
):
    """Soft delete user (Admin only)"""
    repo = UserRepository()
    
    user = await repo.get_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent self-deletion
    current_user_id = current_user.get("sub") or current_user.get("user_id")
    if current_user_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    await repo.delete(db, user_id)
