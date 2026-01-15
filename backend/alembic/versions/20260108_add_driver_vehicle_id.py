"""add driver vehicle_id

Revision ID: 20260108_add_driver_vehicle_id
Revises: 20260108_fix_payment_tables
Create Date: 2026-01-08 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260108_add_driver_vehicle_id'
down_revision = '20260108_fix_payment_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add vehicle_id column to drivers table
    op.add_column('drivers', sa.Column('vehicle_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_drivers_vehicle_id', 
        'drivers', 
        'vehicles', 
        ['vehicle_id'], 
        ['id'],
        ondelete='SET NULL'
    )


def downgrade() -> None:
    # Remove vehicle_id column from drivers table
    op.drop_constraint('fk_drivers_vehicle_id', 'drivers', type_='foreignkey')
    op.drop_column('drivers', 'vehicle_id')
