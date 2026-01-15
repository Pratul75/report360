"""add promoter language

Revision ID: 20260106_add_promoter_language
Revises: 
Create Date: 2026-01-06 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20260106_add_promoter_language'
down_revision = '20260106_add_rbac_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    cols = [c['name'] for c in inspector.get_columns('promoters')]
    if 'language' not in cols:
        op.add_column('promoters', sa.Column('language', sa.String(length=100), nullable=True))


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    cols = [c['name'] for c in inspector.get_columns('promoters')]
    if 'language' in cols:
        op.drop_column('promoters', 'language')
