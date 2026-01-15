"""Extend driver_assignments for vendor booking and work assignment

Revision ID: 20260109_vendor_booking
Revises: 20260109_driver_dashboard
Create Date: 2026-01-09 10:45:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = '20260109_vendor_booking'
down_revision = '20260109_driver_dashboard'
branch_labels = None
depends_on = None


def upgrade():
    """
    Safely extend driver_assignments table with vendor booking fields.
    All fields are nullable to maintain backward compatibility.
    """
    # Add vehicle_id reference
    op.add_column('driver_assignments', 
        sa.Column('vehicle_id', sa.Integer(), nullable=True)
    )
    op.create_foreign_key(
        'fk_driver_assignments_vehicle_id',
        'driver_assignments', 'vehicles',
        ['vehicle_id'], ['id'],
        ondelete='SET NULL'
    )
    op.create_index('ix_driver_assignments_vehicle_id', 'driver_assignments', ['vehicle_id'])
    
    # Add work details fields
    op.add_column('driver_assignments', 
        sa.Column('work_title', sa.String(255), nullable=True, comment='Type of work: Sampling, Promotion, Transport, etc.')
    )
    op.add_column('driver_assignments', 
        sa.Column('work_description', sa.Text(), nullable=True, comment='Detailed work description')
    )
    op.add_column('driver_assignments', 
        sa.Column('village_name', sa.String(255), nullable=True, comment='Village or location name')
    )
    op.add_column('driver_assignments', 
        sa.Column('location_address', sa.Text(), nullable=True, comment='Full address of work location')
    )
    
    # Add time fields
    op.add_column('driver_assignments', 
        sa.Column('expected_start_time', sa.Time(), nullable=True, comment='Expected start time')
    )
    op.add_column('driver_assignments', 
        sa.Column('expected_end_time', sa.Time(), nullable=True, comment='Expected end time')
    )
    
    # Add actual time tracking (for driver to record)
    op.add_column('driver_assignments', 
        sa.Column('actual_start_time', sa.DateTime(), nullable=True, comment='Actual start time recorded by driver')
    )
    op.add_column('driver_assignments', 
        sa.Column('actual_end_time', sa.DateTime(), nullable=True, comment='Actual end time recorded by driver')
    )
    
    print("✅ Extended driver_assignments table with vendor booking fields")


def downgrade():
    """Remove vendor booking fields from driver_assignments"""
    # Remove indexes and foreign keys first
    op.drop_index('ix_driver_assignments_vehicle_id', 'driver_assignments')
    op.drop_constraint('fk_driver_assignments_vehicle_id', 'driver_assignments', type_='foreignkey')
    
    # Remove columns
    op.drop_column('driver_assignments', 'actual_end_time')
    op.drop_column('driver_assignments', 'actual_start_time')
    op.drop_column('driver_assignments', 'expected_end_time')
    op.drop_column('driver_assignments', 'expected_start_time')
    op.drop_column('driver_assignments', 'location_address')
    op.drop_column('driver_assignments', 'village_name')
    op.drop_column('driver_assignments', 'work_description')
    op.drop_column('driver_assignments', 'work_title')
    op.drop_column('driver_assignments', 'vehicle_id')
    
    print("✅ Removed vendor booking fields from driver_assignments")
