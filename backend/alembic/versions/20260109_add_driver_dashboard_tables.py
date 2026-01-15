"""add_driver_dashboard_tables

Revision ID: 20260109_driver_dashboard
Revises: 
Create Date: 2026-01-09

Description:
- Creates driver_profiles table for driver self-onboarding
- Creates daily_km_logs table for start/end KM tracking with GPS and photos
- Creates driver_assignments table to link drivers with campaigns/projects
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = '20260109_driver_dashboard'
down_revision = '20260108_add_driver_vehicle_id'  # Latest migration
branch_labels = None
depends_on = None


def upgrade():
    # Driver Profiles Table (Extended driver information)
    op.create_table('driver_profiles',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('driver_id', sa.Integer(), nullable=False),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('emergency_contact_name', sa.String(length=255), nullable=True),
        sa.Column('emergency_contact_phone', sa.String(length=20), nullable=True),
        sa.Column('blood_group', sa.String(length=10), nullable=True),
        sa.Column('profile_photo', sa.String(length=500), nullable=True),
        sa.Column('aadhar_number', sa.String(length=20), nullable=True),
        sa.Column('aadhar_photo', sa.String(length=500), nullable=True),
        sa.Column('is_profile_complete', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.ForeignKeyConstraint(['driver_id'], ['drivers.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('driver_id')
    )
    op.create_index('idx_driver_profiles_driver_id', 'driver_profiles', ['driver_id'])

    # Daily KM Logs Table (Start/End KM tracking)
    op.create_table('daily_km_logs',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('driver_id', sa.Integer(), nullable=False),
        sa.Column('vehicle_id', sa.Integer(), nullable=True),
        sa.Column('log_date', sa.Date(), nullable=False),
        
        # Start KM Details
        sa.Column('start_km', sa.Float(), nullable=True),
        sa.Column('start_km_photo', sa.String(length=500), nullable=True),
        sa.Column('start_latitude', sa.Float(), nullable=True),
        sa.Column('start_longitude', sa.Float(), nullable=True),
        sa.Column('start_timestamp', sa.DateTime(), nullable=True),
        
        # End KM Details
        sa.Column('end_km', sa.Float(), nullable=True),
        sa.Column('end_km_photo', sa.String(length=500), nullable=True),
        sa.Column('end_latitude', sa.Float(), nullable=True),
        sa.Column('end_longitude', sa.Float(), nullable=True),
        sa.Column('end_timestamp', sa.DateTime(), nullable=True),
        
        # Calculated
        sa.Column('total_km', sa.Float(), nullable=True),  # Auto-calculated: end_km - start_km
        sa.Column('status', sa.Enum('PENDING', 'IN_PROGRESS', 'COMPLETED', name='km_log_status'), default='PENDING'),
        
        sa.Column('remarks', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('is_active', sa.Boolean(), default=True),
        
        sa.ForeignKeyConstraint(['driver_id'], ['drivers.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['vehicle_id'], ['vehicles.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_daily_km_logs_driver_date', 'daily_km_logs', ['driver_id', 'log_date'])
    op.create_index('idx_daily_km_logs_status', 'daily_km_logs', ['status'])

    # Driver Assignments Table (Link drivers to campaigns/projects)
    op.create_table('driver_assignments',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('driver_id', sa.Integer(), nullable=False),
        sa.Column('campaign_id', sa.Integer(), nullable=True),
        sa.Column('project_id', sa.Integer(), nullable=True),
        sa.Column('assignment_date', sa.Date(), nullable=False),
        sa.Column('task_description', sa.Text(), nullable=True),
        sa.Column('status', sa.Enum('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', name='assignment_status'), default='ASSIGNED'),
        sa.Column('assigned_by_id', sa.Integer(), nullable=True),  # User who assigned
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('remarks', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('is_active', sa.Boolean(), default=True),
        
        sa.ForeignKeyConstraint(['driver_id'], ['drivers.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['campaign_id'], ['campaigns.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['assigned_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_driver_assignments_driver_date', 'driver_assignments', ['driver_id', 'assignment_date'])
    op.create_index('idx_driver_assignments_status', 'driver_assignments', ['status'])


def downgrade():
    op.drop_index('idx_driver_assignments_status', table_name='driver_assignments')
    op.drop_index('idx_driver_assignments_driver_date', table_name='driver_assignments')
    op.drop_table('driver_assignments')
    
    op.drop_index('idx_daily_km_logs_status', table_name='daily_km_logs')
    op.drop_index('idx_daily_km_logs_driver_date', table_name='daily_km_logs')
    op.drop_table('daily_km_logs')
    
    op.drop_index('idx_driver_profiles_driver_id', table_name='driver_profiles')
    op.drop_table('driver_profiles')
