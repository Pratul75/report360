"""campaign cascade delete

Revision ID: 20260111_campaign_cascade
Revises: 20260106_add_promoter_language
Create Date: 2026-01-11 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260111_campaign_cascade'
down_revision = '20260106_add_promoter_language'
branch_labels = None
depends_on = None


def upgrade():
    # Drop existing foreign key constraint
    op.drop_constraint('campaigns_ibfk_1', 'campaigns', type_='foreignkey')
    
    # Add foreign key constraint with CASCADE DELETE
    op.create_foreign_key(
        'campaigns_ibfk_1',
        'campaigns', 'projects',
        ['project_id'], ['id'],
        ondelete='CASCADE'
    )


def downgrade():
    # Drop CASCADE constraint
    op.drop_constraint('campaigns_ibfk_1', 'campaigns', type_='foreignkey')
    
    # Restore original constraint without CASCADE
    op.create_foreign_key(
        'campaigns_ibfk_1',
        'campaigns', 'projects',
        ['project_id'], ['id']
    )
