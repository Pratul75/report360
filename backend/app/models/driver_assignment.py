from sqlalchemy import Column, String, Text, Date, Time, ForeignKey, Enum as SQLEnum, DateTime
from sqlalchemy.orm import relationship
import enum
from app.models.base import Base, BaseModel
from sqlalchemy import Integer

class AssignmentStatus(str, enum.Enum):
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class ApprovalStatus(str, enum.Enum):
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class DriverAssignment(Base, BaseModel):
    """Driver assignments to campaigns/projects with work details"""
    __tablename__ = "driver_assignments"
    
    # Core references
    driver_id = Column(Integer, ForeignKey("drivers.id", ondelete="CASCADE"), nullable=False, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id", ondelete="SET NULL"))
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="SET NULL"))
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="SET NULL"), index=True)
    
    # Date and time
    assignment_date = Column(Date, nullable=False, index=True)
    expected_start_time = Column(Time, comment="Expected start time")
    expected_end_time = Column(Time, comment="Expected end time")
    actual_start_time = Column(DateTime, comment="Actual start time recorded by driver")
    actual_end_time = Column(DateTime, comment="Actual end time recorded by driver")
    
    # Work details (for vendor booking)
    work_title = Column(String(255), comment="Type of work: Sampling, Promotion, Transport, etc.")
    work_description = Column(Text, comment="Detailed work description")
    village_name = Column(String(255), comment="Village or location name")
    location_address = Column(Text, comment="Full address of work location")
    
    # Legacy field (kept for backward compatibility)
    task_description = Column(Text, comment="Legacy task description field")
    
    # Status and tracking
    status = Column(SQLEnum(AssignmentStatus), default=AssignmentStatus.ASSIGNED, index=True)
    assigned_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    completed_at = Column(DateTime)
    remarks = Column(Text)
    
    # Driver approval fields
    approval_status = Column(SQLEnum(ApprovalStatus), default=ApprovalStatus.PENDING_APPROVAL, nullable=False, index=True)
    approved_at = Column(DateTime, comment="Timestamp when driver approved")
    rejected_at = Column(DateTime, comment="Timestamp when driver rejected")
    rejection_reason = Column(Text, comment="Reason provided by driver for rejection")
    
    # Relationships
    driver = relationship("Driver", backref="assignments")
    campaign = relationship("Campaign")
    project = relationship("Project")
    vehicle = relationship("Vehicle", foreign_keys=[vehicle_id])
    assigned_by = relationship("User", foreign_keys=[assigned_by_id])
    
    def __repr__(self):
        return f"<DriverAssignment driver_id={self.driver_id} date={self.assignment_date} status={self.status} approval={self.approval_status}>"
