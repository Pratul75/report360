"""Add daily_activity_logs table

Revision ID: 20260129_add_daily_activity_logs
Revises: a613135dcdb3
Create Date: 2026-01-29 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = '20260129_add_daily_activity_logs'
down_revision = 'a613135dcdb3'
branch_labels = None
depends_on = None


def upgrade():
    # Create daily_activity_logs table linked to driver_assignments
    op.create_table(
        'daily_activity_logs',
        sa.Column('id', sa.Integer(), nullable=False, autoincrement=True),
        sa.Column('driver_assignment_id', sa.Integer(), nullable=False, comment="Reference to driver_assignments (one-time campaign assignment)"),
        sa.Column('log_date', sa.Date(), nullable=False, index=True, comment="Date of activity"),
        
        # Core activity fields
        sa.Column('activity_details', sa.Text(), nullable=True, comment="Description of work done"),
        sa.Column('villages', mysql.JSON(), nullable=True, comment="Array of village names visited"),
        sa.Column('images', mysql.JSON(), nullable=True, comment="Array of image URLs/identifiers"),
        
        # Location (GPS)
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('location_address', sa.Text(), nullable=True),
        
        # Dynamic fields (future-proof: flexible JSON for optional/custom fields)
        sa.Column('extra_data', mysql.JSON(), nullable=True, comment="Dynamic JSON for additional fields (flexible, backward-compatible)"),
        
        # Metadata
        sa.Column('created_by_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        
        # Primary and Foreign Keys
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['driver_assignment_id'], ['driver_assignments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ondelete='SET NULL'),
    )
    
    # Create indexes for common queries
    op.create_index('idx_daily_activity_assignment', 'daily_activity_logs', ['driver_assignment_id'])
    op.create_index('idx_daily_activity_date', 'daily_activity_logs', ['log_date'])
    op.create_index('idx_daily_activity_active', 'daily_activity_logs', ['is_active'])
    op.create_index('idx_daily_activity_assignment_date', 'daily_activity_logs', ['driver_assignment_id', 'log_date'])
    
    print("✅ Created daily_activity_logs table linked to driver_assignments")


def downgrade():
    op.drop_index('idx_daily_activity_assignment_date', table_name='daily_activity_logs')
    op.drop_index('idx_daily_activity_active', table_name='daily_activity_logs')
    op.drop_index('idx_daily_activity_date', table_name='daily_activity_logs')
    op.drop_index('idx_daily_activity_assignment', table_name='daily_activity_logs')
    op.drop_table('daily_activity_logs')
