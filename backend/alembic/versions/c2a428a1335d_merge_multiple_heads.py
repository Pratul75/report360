"""merge_multiple_heads

Revision ID: c2a428a1335d
Revises: 20260109_driver_approval, 20260110_photo_longtext, 20260111_campaign_cascade
Create Date: 2026-01-11 17:38:53.665156

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c2a428a1335d'
down_revision = ('20260109_driver_approval', '20260110_photo_longtext', '20260111_campaign_cascade')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
