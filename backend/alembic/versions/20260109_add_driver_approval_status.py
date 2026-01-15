"""Add driver approval status to assignments

Revision ID: 20260109_driver_approval
Revises: 20260109_vendor_booking
Create Date: 2026-01-09 12:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = '20260109_driver_approval'
down_revision = '20260109_vendor_booking'
branch_labels = None
depends_on = None


def upgrade():
    # Add approval status enum
    approval_status_enum = sa.Enum(
        'PENDING_APPROVAL', 
        'APPROVED', 
        'REJECTED',
        name='approval_status'
    )
    
    # Add approval-related columns
    op.add_column('driver_assignments', 
        sa.Column('approval_status', approval_status_enum, nullable=False, server_default='PENDING_APPROVAL'))
    
    op.add_column('driver_assignments', 
        sa.Column('approved_at', sa.DateTime(), nullable=True))
    
    op.add_column('driver_assignments', 
        sa.Column('rejected_at', sa.DateTime(), nullable=True))
    
    op.add_column('driver_assignments', 
        sa.Column('rejection_reason', sa.Text(), nullable=True))
    
    print("✅ Added driver approval status columns to driver_assignments table")


def downgrade():
    # Remove columns in reverse order
    op.drop_column('driver_assignments', 'rejection_reason')
    op.drop_column('driver_assignments', 'rejected_at')
    op.drop_column('driver_assignments', 'approved_at')
    op.drop_column('driver_assignments', 'approval_status')
    
    # Drop enum type
    sa.Enum(name='approval_status').drop(op.get_bind(), checkfirst=True)
    
    print("✅ Removed driver approval status columns from driver_assignments table")
