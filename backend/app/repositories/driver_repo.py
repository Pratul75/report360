from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session, joinedload
from app.repositories.base_repo import BaseRepository
from app.models.driver import Driver
from app.models.vehicle import Vehicle

class DriverRepository(BaseRepository):
    def __init__(self, db: Session = None):
        super().__init__(Driver)
        self.db = db
    
    async def get_by_id(self, db: AsyncSession, id: int):
        """Get driver by ID with vehicle and vendor relationships loaded"""
        query = select(Driver).where(
            Driver.id == id,
            Driver.is_active == 1
        ).options(
            joinedload(Driver.vehicle),
            joinedload(Driver.vendor)
        )
        result = await db.execute(query)
        driver = result.scalar_one_or_none()
        
        if driver:
            if driver.vehicle:
                driver.vehicle_number = driver.vehicle.vehicle_number
            if driver.vendor:
                driver.vendor_name = driver.vendor.name
        
        return driver
    
    async def get_all(self, db: AsyncSession, filters: dict = None):
        """Get all drivers with vehicle and vendor relationships loaded"""
        query = select(Driver).where(
            Driver.is_active == 1
        ).options(
            joinedload(Driver.vehicle),
            joinedload(Driver.vendor)
        )
        
        if filters:
            for key, value in filters.items():
                if hasattr(Driver, key):
                    query = query.where(getattr(Driver, key) == value)
        
        result = await db.execute(query)
        drivers = result.scalars().unique().all()
        
        # Populate vehicle_number and vendor_name for display
        for driver in drivers:
            if driver.vehicle:
                driver.vehicle_number = driver.vehicle.vehicle_number
            if driver.vendor:
                driver.vendor_name = driver.vendor.name
        
        return drivers
    
    async def get_active_drivers(self, db: AsyncSession):
        """Get all active drivers (async)"""
        return await self.get_all(db, {"is_active": True})
    
    async def get_by_vendor_async(self, db: AsyncSession, vendor_id: int):
        """Get drivers by vendor ID (async)"""
        query = select(Driver).where(
            Driver.vendor_id == vendor_id,
            Driver.is_active == True
        ).options(
            joinedload(Driver.vehicle),
            joinedload(Driver.vendor)
        )
        result = await db.execute(query)
        drivers = result.scalars().unique().all()
        
        # Populate vehicle_number and vendor_name for display
        for driver in drivers:
            if driver.vehicle:
                driver.vehicle_number = driver.vehicle.vehicle_number
            if driver.vendor:
                driver.vendor_name = driver.vendor.name
        
        return drivers
    
    def get_all_sync(self):
        """Get all active drivers (sync)"""
        return self.db.query(Driver).filter(Driver.is_active == True).all()
    
    def get_by_vendor(self, vendor_id: int):
        """Get drivers by vendor ID (sync)"""
        return self.db.query(Driver).filter(
            Driver.vendor_id == vendor_id,
            Driver.is_active == True
        ).all()
