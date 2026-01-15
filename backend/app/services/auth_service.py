from fastapi import HTTPException, status
from sqlalchemy import select, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import verify_password, get_password_hash, create_access_token
from app.schemas.auth import UserCreate, UserLogin, UserResponse, TokenResponse
from app.models.user import User
from app.models.vendor import Vendor
from app.core.config import settings
from app.core.role_permissions import RolePermissions, MENU_VISIBILITY

class AuthService:
    
    async def register_user(self, db: AsyncSession, user_data: UserCreate) -> UserResponse:
        """Register a new user"""
        
        # Check if user exists
        result = await db.execute(select(User).where(User.email == user_data.email))
        existing = result.scalar_one_or_none()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Auto-link vendor_id for vendor role
        vendor_id = user_data.vendor_id
        if user_data.role == "vendor" and not vendor_id:
            # Try to find existing vendor by email or phone
            vendor_query = select(Vendor).where(
                and_(
                    Vendor.is_active == 1,
                    or_(
                        Vendor.email == user_data.email,
                        Vendor.phone == user_data.phone if user_data.phone else False
                    )
                )
            )
            vendor_result = await db.execute(vendor_query)
            existing_vendor = vendor_result.scalar_one_or_none()
            
            if existing_vendor:
                vendor_id = existing_vendor.id
                print(f"✅ Auto-linked vendor: {existing_vendor.company_name} (ID: {vendor_id}) to user: {user_data.email}")
            else:
                print(f"⚠️ No existing vendor found for email: {user_data.email} or phone: {user_data.phone}")
        
        # Create user
        user = User(
            email=user_data.email,
            name=user_data.name,
            phone=user_data.phone,
            password_hash=get_password_hash(user_data.password),
            role=user_data.role,
            vendor_id=vendor_id
        )
        
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
        return UserResponse.model_validate(user)
    
    async def login_user(self, db: AsyncSession, credentials: UserLogin) -> TokenResponse:
        """Login user and return token"""
        
        # Find user
        result = await db.execute(select(User).where(User.email == credentials.email))
        user = result.scalar_one_or_none()
        
        if not user or not verify_password(credentials.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive"
            )
        
        # Create access token
        access_token = create_access_token(
            data={
                "user_id": user.id,
                "email": user.email,
                "role": user.role.value,
                "vendor_id": user.vendor_id
            }
        )
        
        user_response = UserResponse.model_validate(user)
        
        # Get permissions and menu items for this role
        user_role = user.role.value
        permissions = [perm.value for perm in RolePermissions.get_permissions(user_role)]
        menu_items = MENU_VISIBILITY.get(user_role, ["dashboard"])
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=user_response,
            permissions=permissions,
            menu_items=menu_items
        )
    
    async def get_current_user_info(self, db: AsyncSession, email: str) -> UserResponse:
        """Get current user information"""
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return UserResponse.model_validate(user)
