"""Driver service - handles business logic for drivers including user account creation"""
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.driver import Driver
from app.core.permissions import UserRole
from app.core.security import get_password_hash
from app.repositories.driver_repo import DriverRepository
from app.repositories.user_repo import UserRepository
import secrets
import string
import logging

logger = logging.getLogger(__name__)

class DriverService:
    """Service for driver operations"""
    
    def __init__(self):
        self.driver_repo = DriverRepository()
        self.user_repo = UserRepository()
    
    async def create_driver_with_user(self, db: AsyncSession, driver_data: dict) -> Driver:
        """
        Create a driver and automatically create a corresponding user account
        
        Args:
            db: Database session
            driver_data: Driver data dictionary
        
        Returns:
            Driver: Created driver object
        
        Note:
            - User account is only created if email is provided
            - Password is auto-generated and strong
            - Driver and User must have the same email for linking
        """
        # Extract required fields
        email = driver_data.get('email')
        name = driver_data.get('name')
        phone = driver_data.get('phone')
        
        # Create driver in database first
        driver = await self.driver_repo.create(db, driver_data)
        await db.commit()
        
        # Create corresponding user account if email is provided
        if email and name:
            try:
                # Generate a strong temporary password
                temp_password = self._generate_temp_password()
                hashed_password = get_password_hash(temp_password)
                
                # Prepare user data
                user_data = {
                    'email': email,
                    'name': name,
                    'phone': phone or '',
                    'password_hash': hashed_password,
                    'password_hint': temp_password,  # Store temp password hint
                    'role': UserRole.DRIVER.value,  # Set role as "driver"
                }
                
                # Create user account
                user = await self.user_repo.create(db, user_data)
                await db.commit()
                
                logger.info(f"✅ Created user account for driver {email} (ID: {driver.id})")
                
            except Exception as e:
                # If user creation fails, driver is still created
                logger.warning(f"⚠️  Could not create user for driver {email}: {str(e)}")
                await db.commit()
        else:
            logger.info(f"⚠️  No email provided for driver, skipping user account creation")
        
        # Return the created driver with all details
        return await self.driver_repo.get_by_id(db, driver.id)
    
    def _generate_temp_password(self) -> str:
        """
        Generate a strong temporary password for new drivers
        
        Returns:
            str: 12-character password with letters, numbers, and special chars
        """
        characters = string.ascii_letters + string.digits + "!@#$%^&*()"
        return ''.join(secrets.choice(characters) for _ in range(12))
