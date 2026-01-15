"""add bill_image to expenses

Revision ID: 20260108_add_bill_image
Revises: 20260108_add_promoter_activities
Create Date: 2026-01-08 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260108_add_bill_image'
down_revision = '20260108_add_promoter_activities'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add bill_image column to expenses table
    op.add_column('expenses', sa.Column('bill_image', sa.String(length=500), nullable=True))


def downgrade() -> None:
    # Remove bill_image column from expenses table
    op.drop_column('expenses', 'bill_image')
