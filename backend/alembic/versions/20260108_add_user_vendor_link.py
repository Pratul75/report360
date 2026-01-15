"""Add vendor_id to users for vendor role linking

Revision ID: 20260108_add_user_vendor_link
Revises: 20260108_vendor_dashboard
Create Date: 2026-01-08 11:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260108_add_user_vendor_link'
down_revision = '20260108_vendor_dashboard'
branch_labels = None
depends_on = None


def upgrade():
    # Add vendor_id column to users table
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('users')]
    
    if 'vendor_id' not in columns:
        op.add_column('users', sa.Column('vendor_id', sa.Integer(), nullable=True))
        op.create_foreign_key(
            'fk_users_vendor_id',
            'users', 'vendors',
            ['vendor_id'], ['id'],
            ondelete='SET NULL'
        )


def downgrade():
    # Remove vendor_id column from users table
    op.drop_constraint('fk_users_vendor_id', 'users', type_='foreignkey')
    op.drop_column('users', 'vendor_id')
