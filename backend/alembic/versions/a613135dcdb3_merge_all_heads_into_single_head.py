"""merge all heads into single head

Revision ID: a613135dcdb3
Revises: 20260122_fix_assigned_cs_to_fk, a21fa6959eb0
Create Date: 2026-01-23 05:21:06.907716

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a613135dcdb3'
down_revision = ('20260122_fix_assigned_cs_to_fk', 'a21fa6959eb0')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
