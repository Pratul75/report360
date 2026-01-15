"""remove_vendor_company_field

Revision ID: 8bc5b2177319
Revises: 9d683fcf9fae
Create Date: 2026-01-13 07:50:12.809288

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '8bc5b2177319'
down_revision = '9d683fcf9fae'
branch_labels = None
depends_on = None


def upgrade():
    # Drop company column from vendors table
    op.drop_column('vendors', 'company')


def downgrade():
    # Add company column back if needed to rollback
    op.add_column('vendors', sa.Column('company', sa.String(255), nullable=True))
