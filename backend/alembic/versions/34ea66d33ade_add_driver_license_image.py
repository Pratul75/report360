"""add_driver_license_image

Revision ID: 34ea66d33ade
Revises: 8bc5b2177319
Create Date: 2026-01-13 08:03:11.764419

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '34ea66d33ade'
down_revision = '8bc5b2177319'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('drivers', sa.Column('license_image', sa.String(255), nullable=True))


def downgrade():
    op.drop_column('drivers', 'license_image')
