"""Fix assigned_cs to be a proper FK to users table

Revision ID: 20260122_fix_assigned_cs_to_fk
Revises: 20260122_add_video_to_promoter_activities
Create Date: 2026-01-22 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20260122_fix_assigned_cs_to_fk'
down_revision = '20260122_add_video_to_promoter_activities'
branch_labels = None
depends_on = None


def upgrade():
    # Step 1: Add new column as Integer (nullable)
    op.add_column(
        'projects',
        sa.Column('assigned_cs_new', sa.Integer, nullable=True)
    )
    
    # Step 2: Migrate data - try to convert string IDs to integers
    # This will set NULL for invalid values
    op.execute('''
    UPDATE projects 
    SET assigned_cs_new = CAST(assigned_cs AS UNSIGNED INTEGER)
    WHERE assigned_cs IS NOT NULL 
    AND assigned_cs REGEXP '^[0-9]+$'
    ''')
    
    # Step 3: Drop old column
    op.drop_column('projects', 'assigned_cs')
    
    # Step 4: Rename new column to assigned_cs
    op.alter_column('projects', 'assigned_cs_new', new_column_name='assigned_cs')
    
    # Step 5: Add FK constraint
    op.create_foreign_key(
        'fk_projects_assigned_cs',
        'projects', 'users',
        ['assigned_cs'], ['id'],
        ondelete='SET NULL'
    )


def downgrade():
    # Revert: Drop FK, convert back to string
    op.drop_constraint('fk_projects_assigned_cs', 'projects', type_='foreignkey')
    
    op.add_column('projects', sa.Column('assigned_cs_old', sa.String(255), nullable=True))
    op.execute('UPDATE projects SET assigned_cs_old = CAST(assigned_cs AS CHAR) WHERE assigned_cs IS NOT NULL')
    op.drop_column('projects', 'assigned_cs')
    op.alter_column('projects', 'assigned_cs_old', new_column_name='assigned_cs')
