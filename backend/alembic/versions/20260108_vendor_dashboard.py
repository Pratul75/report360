"""Add invoice and payment tables for vendor dashboard

Revision ID: 20260108_vendor_dashboard
Revises: 20260108_add_bill_image
Create Date: 2026-01-08 10:50:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260108_vendor_dashboard'
down_revision = '20260108_add_bill_image'
branch_labels = None
depends_on = None


def upgrade():
    # Check and create invoices table
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    if 'invoices' not in inspector.get_table_names():
        op.create_table(
            'invoices',
            sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
            sa.Column('invoice_number', sa.String(length=100), nullable=False),
            sa.Column('invoice_file', sa.String(length=500), nullable=True),
            sa.Column('amount', sa.Float(), nullable=False),
            sa.Column('invoice_date', sa.Date(), nullable=False),
            sa.Column('status', sa.Enum('pending', 'submitted', 'approved', 'rejected', 'paid', name='invoicestatus'), nullable=True),
            sa.Column('vendor_id', sa.Integer(), nullable=False),
            sa.Column('campaign_id', sa.Integer(), nullable=True),
            sa.Column('is_active', sa.Boolean(), server_default='1', nullable=True),
            sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
            sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'), nullable=True),
            sa.ForeignKeyConstraint(['campaign_id'], ['campaigns.id'], ondelete='SET NULL'),
            sa.ForeignKeyConstraint(['vendor_id'], ['vendors.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('invoice_number')
        )
        op.create_index(op.f('ix_invoices_id'), 'invoices', ['id'], unique=False)
    
    # Check and create payments table
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
    # Drop payments table
    op.drop_index(op.f('ix_payments_id'), table_name='payments')
    op.drop_table('payments')
    
    # Drop invoices table
    op.drop_index(op.f('ix_invoices_id'), table_name='invoices')
    op.drop_table('invoices')
