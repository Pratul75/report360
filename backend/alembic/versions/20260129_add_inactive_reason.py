"""Add inactive_reason columns to drivers and vehicles

Revision ID: 20260129_add_inactive_reason
Revises: 20260129_replace_time_with_date
Create Date: 2026-01-29 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260129_add_inactive_reason'
down_revision = '20260129_replace_time_with_date'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add inactive_reason column to drivers table
    op.add_column('drivers', 
        sa.Column('inactive_reason', sa.Text, nullable=True)
    )
    
    # Add inactive_reason column to vehicles table
    op.add_column('vehicles', 
        sa.Column('inactive_reason', sa.Text, nullable=True)
    )


def downgrade() -> None:
    # Remove inactive_reason column from vehicles table
    op.drop_column('vehicles', 'inactive_reason')
    
    # Remove inactive_reason column from drivers table
    op.drop_column('drivers', 'inactive_reason')
