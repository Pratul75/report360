from sqlalchemy import Column, String, Text, Float, Date, ForeignKey, Enum as SQLEnum, DateTime
from sqlalchemy.orm import relationship
import enum
from app.models.base import Base, BaseModel
from sqlalchemy import Integer
from app.utils.gps_utils import calculate_journey_distance

class KMLogStatus(str, enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"

class DailyKMLog(Base, BaseModel):
    """Daily KM tracking with GPS and photos"""
    __tablename__ = "daily_km_logs"
    
    driver_id = Column(Integer, ForeignKey("drivers.id", ondelete="CASCADE"), nullable=False, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="SET NULL"))
    log_date = Column(Date, nullable=False, index=True)
    
    # Start Journey - GPS based (MANDATORY)
    start_km = Column(Float)  # DEPRECATED - kept for backward compatibility
    start_km_photo = Column(Text)  # Base64 encoded image (activity proof)
    start_latitude = Column(Float)  # PRIMARY: GPS latitude
    start_longitude = Column(Float)  # PRIMARY: GPS longitude
    start_timestamp = Column(DateTime)
    
    # End Journey - GPS based (MANDATORY)
    end_km = Column(Float)  # DEPRECATED - kept for backward compatibility
    end_km_photo = Column(Text)  # Base64 encoded image (activity proof)
    end_latitude = Column(Float)  # PRIMARY: GPS latitude
    end_longitude = Column(Float)  # PRIMARY: GPS longitude
    end_timestamp = Column(DateTime)
    
    # Calculated - GPS distance based (AUTO-CALCULATED)
    total_km = Column(Float)  # Calculated from GPS coordinates
    status = Column(SQLEnum(KMLogStatus), default=KMLogStatus.PENDING)
    remarks = Column(Text)
    
    # Relationships
    driver = relationship("Driver", backref="km_logs")
    vehicle = relationship("Vehicle")
    
    def calculate_total_km_gps(self) -> float:
        """
        Calculate total KM using GPS coordinates (NEW METHOD).
        This is now the PRIMARY method for KM calculation.
        
        Returns:
            Distance in kilometers or 0.0 if coordinates are invalid
        """
        try:
            distance = calculate_journey_distance(
                self.start_latitude,
                self.start_longitude,
                self.end_latitude,
                self.end_longitude
            )
            
            if distance is not None and distance >= 0:
                self.total_km = distance
                self.status = KMLogStatus.COMPLETED
                return distance
            
            return 0.0
        except Exception as e:
            print(f"GPS calculation error: {e}")
            return 0.0
    
    def calculate_total_km(self):
        """
        DEPRECATED: Old manual KM calculation method.
        Kept for backward compatibility only.
        New code should use calculate_total_km_gps()
        """
        # If GPS coordinates exist, use GPS calculation
        if self.start_latitude and self.start_longitude and self.end_latitude and self.end_longitude:
            return self.calculate_total_km_gps()
        
        # Fallback to old method for legacy data
        if self.end_km and self.start_km:
            self.total_km = self.end_km - self.start_km
            if self.total_km >= 0:
                self.status = KMLogStatus.COMPLETED
            return self.total_km
        return None
    
    def __repr__(self):
        return f"<DailyKMLog driver_id={self.driver_id} date={self.log_date} total={self.total_km}km>"

