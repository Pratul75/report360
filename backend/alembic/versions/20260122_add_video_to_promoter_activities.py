"""Add video field to promoter_activities table

Revision ID: 20260122_add_video_to_promoter_activities
Revises: 20260108_add_promoter_activities
Create Date: 2026-01-22 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20260122_add_video_to_promoter_activities'
down_revision = '20260108_add_promoter_activities'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'promoter_activities',
        sa.Column('activity_video', sa.String(500), nullable=True)
    )


def downgrade():
    op.drop_column('promoter_activities', 'activity_video')
