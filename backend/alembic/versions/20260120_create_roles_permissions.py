"""Create roles, permissions, and role_permissions tables

Revision ID: 20260120_create_roles_permissions
Revises: 20260120_drop_unique_godown_id_inventory_items
Create Date: 2026-01-20
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20260120_create_roles_permissions'
down_revision = '20260120_drop_unique_godown_id_inventory_items'
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        'roles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(255), nullable=False, unique=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_protected', sa.Boolean(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_roles_id'), 'roles', ['id'], unique=False)

    op.create_table(
        'permissions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(255), nullable=False, unique=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_permissions_id'), 'permissions', ['id'], unique=False)

    op.create_table(
        'role_permissions',
        sa.Column('role_id', sa.Integer(), nullable=False),
        sa.Column('permission_id', sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint('role_id', 'permission_id'),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id']),
        sa.ForeignKeyConstraint(['permission_id'], ['permissions.id'])
    )

def downgrade():
    op.drop_table('role_permissions')
    op.drop_index(op.f('ix_permissions_id'), table_name='permissions')
    op.drop_table('permissions')
    op.drop_index(op.f('ix_roles_id'), table_name='roles')
    op.drop_table('roles')