"""merge all alembic heads

Revision ID: a21fa6959eb0
Revises: 20260120_create_roles_permissions, 20260122_add_video_to_promoter_activities
Create Date: 2026-01-22 06:06:04.240644

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a21fa6959eb0'
down_revision = ('20260120_create_roles_permissions', '20260122_add_video_to_promoter_activities')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
