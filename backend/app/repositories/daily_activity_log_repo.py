from sqlalchemy.orm import Session
from app.models.daily_activity_log import DailyActivityLog

class DailyActivityLogRepository:
    """Repository for daily activity logs"""
    
    def __init__(self, db: Session):
        self.db = db

    def create_log(self, log_data: dict) -> DailyActivityLog:
        """Create a new daily activity log - prevents duplicates for same date"""
        from sqlalchemy import and_
        
        # Check if log already exists for this date
        existing_log = self.db.query(DailyActivityLog).filter(
            and_(
                DailyActivityLog.driver_assignment_id == log_data.get('driver_assignment_id'),
                DailyActivityLog.log_date == log_data.get('log_date'),
                DailyActivityLog.is_active == True
            )
        ).first()
        
        if existing_log:
            # Return existing log instead of creating duplicate
            return existing_log
        
        log = DailyActivityLog(**log_data)
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)
        return log

    def get_log_by_id(self, log_id: int) -> DailyActivityLog:
        """Get a daily log by ID"""
        return self.db.query(DailyActivityLog).filter(DailyActivityLog.id == log_id).first()

    def list_logs_by_assignment(self, assignment_id: int):
        """List all logs for a driver assignment"""
        return self.db.query(DailyActivityLog).filter(
            DailyActivityLog.driver_assignment_id == assignment_id
        ).order_by(DailyActivityLog.log_date.desc()).all()

    def list_logs_by_date(self, log_date):
        """List all logs for a specific date"""
        return self.db.query(DailyActivityLog).filter(
            DailyActivityLog.log_date == log_date
        ).all()

    def list_logs_by_driver_campaign(self, driver_id: int, campaign_id: int):
        """List all logs for a driver in a specific campaign"""
        return self.db.query(DailyActivityLog).filter(
            DailyActivityLog.driver_id == driver_id,
            DailyActivityLog.campaign_id == campaign_id
        ).order_by(DailyActivityLog.log_date.desc()).all()

    def update_log(self, log_id: int, update_data: dict) -> DailyActivityLog:
        """Update a daily log"""
        log = self.get_log_by_id(log_id)
        if not log:
            return None
        for key, value in update_data.items():
            setattr(log, key, value)
        self.db.commit()
        self.db.refresh(log)
        return log

    def delete_log(self, log_id: int) -> bool:
        """Soft delete a daily log"""
        log = self.get_log_by_id(log_id)
        if not log:
            return False
        log.is_active = False
        self.db.commit()
        return True

