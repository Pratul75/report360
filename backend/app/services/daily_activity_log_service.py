from sqlalchemy.orm import Session
from datetime import datetime, timezone, date
from ..repositories.daily_activity_log_repo import DailyActivityLogRepository

class DailyActivityLogService:
    """Service for managing daily activity logs under driver assignments"""
    
    def __init__(self, db: Session):
        self.db = db
        self.repo = DailyActivityLogRepository(db)
    
    def create_daily_log(self, driver_assignment_id: int, driver_id: int, campaign_id: int = None,
                        log_date: date = None, activity_details: str = None, villages: list = None, 
                        images: list = None, latitude: float = None, longitude: float = None,
                        location_address: str = None, extra_data: dict = None, 
                        created_by_id: int = None):
        """Create a daily activity log for a driver"""
        log_data = {
            'driver_assignment_id': driver_assignment_id,
            'driver_id': driver_id,
            'campaign_id': campaign_id,
            'log_date': log_date or date.today(),
            'activity_details': activity_details,
            'villages': villages,
            'images': images,
            'latitude': latitude,
            'longitude': longitude,
            'location_address': location_address,
            'extra_data': extra_data,
            'created_by_id': created_by_id,
            'is_active': True
        }
        return self.repo.create_log(log_data)
    
    def get_daily_log(self, log_id: int):
        """Get a specific daily log"""
        return self.repo.get_log_by_id(log_id)
    
    def list_logs_for_assignment(self, assignment_id: int):
        """List all daily logs for a driver assignment"""
        return self.repo.list_logs_by_assignment(assignment_id)
    
    def list_logs_for_date(self, log_date: date):
        """List all daily logs for a specific date"""
        return self.repo.list_logs_by_date(log_date)
    
    def list_logs_for_driver_campaign(self, driver_id: int, campaign_id: int):
        """List all daily logs for a driver in a specific campaign"""
        return self.repo.list_logs_by_driver_campaign(driver_id, campaign_id)
    
    def update_daily_log(self, log_id: int, update_data: dict):
        """Update a daily log"""
        return self.repo.update_log(log_id, update_data)
    
    def delete_daily_log(self, log_id: int):
        """Soft delete a daily log"""
        return self.repo.delete_log(log_id)
    
    def add_village_to_log(self, log_id: int, village_name: str):
        """Add a village to an existing log"""
        log = self.get_daily_log(log_id)
        if not log:
            return None
        
        if log.villages is None:
            log.villages = []
        if village_name not in log.villages:
            log.villages.append(village_name)
        self.db.commit()
        self.db.refresh(log)
        return log
    
    def add_image_to_log(self, log_id: int, image_url: str):
        """Add an image to an existing log"""
        log = self.get_daily_log(log_id)
        if not log:
            return None
        
        if log.images is None:
            log.images = []
        if image_url not in log.images:
            log.images.append(image_url)
        self.db.commit()
        self.db.refresh(log)
        return log
    
    def get_activity_count_for_assignment(self, assignment_id: int):
        """Get total activity count (number of logs) for an assignment"""
        from app.models.daily_activity_log import DailyActivityLog
        return self.db.query(DailyActivityLog).filter(
            DailyActivityLog.driver_assignment_id == assignment_id
        ).count()
    
    def get_activity_count_for_driver_in_campaign(self, driver_id: int, campaign_id: int):
        """Get activity count for a specific driver in a campaign"""
        from app.models.daily_activity_log import DailyActivityLog
        return self.db.query(DailyActivityLog).filter(
            DailyActivityLog.driver_id == driver_id,
            DailyActivityLog.campaign_id == campaign_id
        ).count()
    
    def get_daily_activity_count(self, log_date: date):
        """Get activity count for a specific date"""
        from app.models.daily_activity_log import DailyActivityLog
        return self.db.query(DailyActivityLog).filter(
            DailyActivityLog.log_date == log_date
        ).count()

