"""Add promoter_activities table

Revision ID: 20260108_add_promoter_activities
Revises: 20260106_add_promoter_language
Create Date: 2026-01-08 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime

# revision identifiers, used by Alembic.
revision = '20260108_add_promoter_activities'
down_revision = '20260106_add_promoter_language'
branch_labels = None
depends_on = None


def upgrade():
    # Create promoter_activities table
    op.create_table(
        'promoter_activities',
        sa.Column('id', sa.Integer(), nullable=False, autoincrement=True),
        sa.Column('promoter_id', sa.Integer(), nullable=False),
        sa.Column('promoter_name', sa.String(255), nullable=False),
        sa.Column('campaign_id', sa.Integer(), nullable=False),
        sa.Column('village_name', sa.String(255), nullable=False),
        sa.Column('activity_date', sa.Date(), nullable=False),
        sa.Column('people_attended', sa.Integer(), nullable=False, default=0),
        sa.Column('activity_count', sa.Integer(), nullable=False, default=0),
        sa.Column('before_image', sa.String(500), nullable=True),
        sa.Column('during_image', sa.String(500), nullable=True),
        sa.Column('after_image', sa.String(500), nullable=True),
        sa.Column('specialty', sa.String(255), nullable=True),
        sa.Column('language', sa.String(100), nullable=True),
        sa.Column('remarks', sa.Text(), nullable=True),
        sa.Column('created_by_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=datetime.utcnow),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        
        # Primary Key
        sa.PrimaryKeyConstraint('id'),
        
        # Foreign Keys
        sa.ForeignKeyConstraint(['promoter_id'], ['promoters.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['campaign_id'], ['campaigns.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ondelete='SET NULL'),
    )
    
    # Create indexes for performance
    op.create_index('idx_promoter_activities_promoter', 'promoter_activities', ['promoter_id'])
    op.create_index('idx_promoter_activities_campaign', 'promoter_activities', ['campaign_id'])
    op.create_index('idx_promoter_activities_village', 'promoter_activities', ['village_name'])
    op.create_index('idx_promoter_activities_date', 'promoter_activities', ['activity_date'])
    op.create_index('idx_promoter_activities_active', 'promoter_activities', ['is_active'])
    
    # Composite index for common queries
    op.create_index('idx_promoter_activities_campaign_date', 'promoter_activities', ['campaign_id', 'activity_date'])


def downgrade():
    # Drop indexes
    op.drop_index('idx_promoter_activities_campaign_date', table_name='promoter_activities')
    op.drop_index('idx_promoter_activities_active', table_name='promoter_activities')
    op.drop_index('idx_promoter_activities_date', table_name='promoter_activities')
    op.drop_index('idx_promoter_activities_village', table_name='promoter_activities')
    op.drop_index('idx_promoter_activities_campaign', table_name='promoter_activities')
    op.drop_index('idx_promoter_activities_promoter', table_name='promoter_activities')
    
    # Drop table
    op.drop_table('promoter_activities')
