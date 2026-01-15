"""add_vehicle_document_images

Revision ID: 8b94b31d166a
Revises: c2a428a1335d
Create Date: 2026-01-12 08:17:23.423927

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '8b94b31d166a'
down_revision = 'c2a428a1335d'
branch_labels = None
depends_on = None


def upgrade():
    # Add rc_image and insurance_image columns to vehicles table
    op.add_column('vehicles', sa.Column('rc_image', sa.String(500), nullable=True))
    op.add_column('vehicles', sa.Column('insurance_image', sa.String(500), nullable=True))


def downgrade():
    # Remove rc_image and insurance_image columns
    op.drop_column('vehicles', 'insurance_image')
    op.drop_column('vehicles', 'rc_image')
