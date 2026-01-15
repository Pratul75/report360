"""Create godown and inventory_items tables

Revision ID: 20260114_create_godown_inventory
Revises: 34ea66d33ade
Create Date: 2026-01-14 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260114_create_godown_inventory'
down_revision = '34ea66d33ade'
branch_labels = None
depends_on = None


def upgrade():
    # Create godowns table
    op.create_table(
        'godowns',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('location', sa.String(255), nullable=True),
        sa.Column('manager_name', sa.String(255), nullable=True),
        sa.Column('contact_number', sa.String(20), nullable=True),
        sa.Column('remarks', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_godowns_id'), 'godowns', ['id'], unique=False)
    op.create_index(op.f('ix_godowns_name'), 'godowns', ['name'], unique=False)
    op.create_index(op.f('ix_godowns_is_active'), 'godowns', ['is_active'], unique=False)

    # Create inventory_items table
    op.create_table(
        'inventory_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('godown_id', sa.Integer(), nullable=False),
        sa.Column('item_name', sa.String(255), nullable=False),
        sa.Column('item_code', sa.String(100), nullable=False, unique=True),
        sa.Column('category', sa.String(100), nullable=True),
        sa.Column('quantity', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('unit', sa.String(50), nullable=True),
        sa.Column('min_stock_level', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('remarks', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.ForeignKeyConstraint(['godown_id'], ['godowns.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_inventory_items_id'), 'inventory_items', ['id'], unique=False)
    op.create_index(op.f('ix_inventory_items_godown_id'), 'inventory_items', ['godown_id'], unique=False)
    op.create_index(op.f('ix_inventory_items_item_name'), 'inventory_items', ['item_name'], unique=False)
    op.create_index(op.f('ix_inventory_items_item_code'), 'inventory_items', ['item_code'], unique=False)
    op.create_index(op.f('ix_inventory_items_is_active'), 'inventory_items', ['is_active'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_inventory_items_is_active'), table_name='inventory_items')
    op.drop_index(op.f('ix_inventory_items_item_code'), table_name='inventory_items')
    op.drop_index(op.f('ix_inventory_items_item_name'), table_name='inventory_items')
    op.drop_index(op.f('ix_inventory_items_godown_id'), table_name='inventory_items')
    op.drop_index(op.f('ix_inventory_items_id'), table_name='inventory_items')
    op.drop_table('inventory_items')
    
    op.drop_index(op.f('ix_godowns_is_active'), table_name='godowns')
    op.drop_index(op.f('ix_godowns_name'), table_name='godowns')
    op.drop_index(op.f('ix_godowns_id'), table_name='godowns')
    op.drop_table('godowns')
