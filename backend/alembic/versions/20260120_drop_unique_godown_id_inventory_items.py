"""Drop unique index on godown_id in inventory_items (if exists)

Revision ID: 20260120_drop_unique_godown_id_inventory_items
Revises: 20260114_create_godown_inventory
Create Date: 2026-01-20
"""
from alembic import op

# revision identifiers, used by Alembic.
revision = '20260120_drop_unique_godown_id_inventory_items'
down_revision = '20260114_create_godown_inventory'
branch_labels = None
depends_on = None

def upgrade():
    # Drop unique index on godown_id if it exists (MySQL specific)
    conn = op.get_bind()
    indexes = conn.execute("SHOW INDEX FROM inventory_items WHERE Column_name = 'godown_id'").fetchall()
    for idx in indexes:
        if idx['Non_unique'] == 0:
            # Drop the unique index
            op.drop_index(idx['Key_name'], table_name='inventory_items')

def downgrade():
    # No downgrade, as unique index should not be recreated
    pass