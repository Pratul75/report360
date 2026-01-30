"""Replace expected start/end time with assignment start/end date for campaign-based assignments

Revision ID: 20260129_replace_time_with_date
Revises: 20260129_add_daily_activity_logs
Create Date: 2026-01-29 14:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260129_replace_time_with_date'
down_revision = '20260129_add_daily_activity_logs'
branch_labels = None
depends_on = None


def upgrade():
    # Drop old time columns
    op.drop_column('driver_assignments', 'expected_start_time')
    op.drop_column('driver_assignments', 'expected_end_time')
    
    # Add new date columns for campaign-based assignment (multiple days)
    op.add_column('driver_assignments', 
        sa.Column('assignment_start_date', sa.Date(), nullable=True, 
                 comment='Start date of assignment for this campaign')
    )
    op.add_column('driver_assignments', 
        sa.Column('assignment_end_date', sa.Date(), nullable=True, 
                 comment='End date of assignment for this campaign')
    )
    
    # Create indexes for the new date columns
    op.create_index('idx_assignment_start_date', 'driver_assignments', ['assignment_start_date'])
    op.create_index('idx_assignment_end_date', 'driver_assignments', ['assignment_end_date'])
    
    print("✅ Replaced time fields with date range fields for campaign-based assignments")


def downgrade():
    # Drop new date columns
    op.drop_index('idx_assignment_end_date', table_name='driver_assignments')
    op.drop_index('idx_assignment_start_date', table_name='driver_assignments')
    op.drop_column('driver_assignments', 'assignment_end_date')
    op.drop_column('driver_assignments', 'assignment_start_date')
    
    # Restore old time columns
    op.add_column('driver_assignments', 
        sa.Column('expected_end_time', sa.Time(), nullable=True)
    )
    op.add_column('driver_assignments', 
        sa.Column('expected_start_time', sa.Time(), nullable=True)
    )
    
    print("✅ Restored time fields (downgrade)")

