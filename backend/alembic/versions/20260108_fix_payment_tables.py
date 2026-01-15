"""Fix payment tables - rename old to expense_payments, create invoice_payments

Revision ID: 20260108_fix_payment_tables
Revises: 20260108_add_user_vendor_link
Create Date: 2026-01-08 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = '20260108_fix_payment_tables'
down_revision = '20260108_add_user_vendor_link'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    # Rename old payments table to expense_payments if it exists
    if 'payments' in inspector.get_table_names():
        # Check if it has driver_id (old table)
        columns = [col['name'] for col in inspector.get_columns('payments')]
        if 'driver_id' in columns and 'invoice_id' not in columns:
            op.rename_table('payments', 'expense_payments')
    
    # Now create the new payments table for invoices
    if 'payments' not in inspector.get_table_names():
        op.create_table(
            'payments',
            sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
            sa.Column('amount', sa.Float(), nullable=False),
            sa.Column('payment_date', sa.Date(), nullable=True),
            sa.Column('status', sa.Enum('pending', 'processing', 'completed', 'failed', name='paymentstatus'), nullable=True),
            sa.Column('payment_method', sa.Enum('bank_transfer', 'cheque', 'upi', 'cash', 'other', name='paymentmethod'), nullable=True),
            sa.Column('transaction_reference', sa.String(length=255), nullable=True),
            sa.Column('remarks', sa.Text(), nullable=True),
            sa.Column('invoice_id', sa.Integer(), nullable=False),
            sa.Column('vendor_id', sa.Integer(), nullable=False),
            sa.Column('is_active', sa.Boolean(), server_default='1', nullable=True),
            sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
            sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'), nullable=True),
            sa.ForeignKeyConstraint(['invoice_id'], ['invoices.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['vendor_id'], ['vendors.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('invoice_id')
        )
        op.create_index(op.f('ix_payments_id'), 'payments', ['id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_payments_id'), table_name='payments')
    op.drop_table('payments')
    
    # Rename back
    if 'expense_payments' in sa.inspect(op.get_bind()).get_table_names():
        op.rename_table('expense_payments', 'payments')
