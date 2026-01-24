"""add submitted_by to expenses

Revision ID: 20260124_add_submitted_by
Revises: 20260122_fix_assigned_cs_to_fk
Create Date: 2026-01-24 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260124_add_submitted_by'
down_revision = '20260122_fix_assigned_cs_to_fk'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add submitted_by column to expenses table
    op.add_column('expenses', sa.Column('submitted_by', sa.Integer(), nullable=True))
    
    # Create foreign key constraint
    op.create_foreign_key('fk_expenses_submitted_by_users', 
                          'expenses', 'users',
                          ['submitted_by'], ['id'],
                          ondelete='SET NULL')


def downgrade() -> None:
    # Drop foreign key constraint
    op.drop_constraint('fk_expenses_submitted_by_users', 'expenses', type_='foreignkey')
    
    # Remove submitted_by column from expenses table
    op.drop_column('expenses', 'submitted_by')
