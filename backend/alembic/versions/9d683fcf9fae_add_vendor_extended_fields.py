"""add_vendor_extended_fields

Revision ID: 9d683fcf9fae
Revises: 8b94b31d166a
Create Date: 2026-01-13 07:25:34.929373

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9d683fcf9fae'
down_revision = '8b94b31d166a'
branch_labels = None
depends_on = None


def upgrade():
    # Add new vendor fields
    op.add_column('vendors', sa.Column('company_website', sa.String(255), nullable=True))
    op.add_column('vendors', sa.Column('city', sa.String(100), nullable=True))
    op.add_column('vendors', sa.Column('category', sa.String(100), nullable=True))
    op.add_column('vendors', sa.Column('specifications', sa.Text(), nullable=True))
    op.add_column('vendors', sa.Column('designation', sa.String(100), nullable=True))
    op.add_column('vendors', sa.Column('status', sa.String(50), nullable=True))
    op.add_column('vendors', sa.Column('remarks', sa.Text(), nullable=True))


def downgrade():
    # Remove added vendor fields
    op.drop_column('vendors', 'remarks')
    op.drop_column('vendors', 'status')
    op.drop_column('vendors', 'designation')
    op.drop_column('vendors', 'specifications')
    op.drop_column('vendors', 'category')
    op.drop_column('vendors', 'city')
    op.drop_column('vendors', 'company_website')
