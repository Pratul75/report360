"""update photo columns to longtext

Revision ID: 20260110_photo_longtext
Revises: 20260106_add_promoter_language
Create Date: 2026-01-10 15:50:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = '20260110_photo_longtext'
down_revision = '20260106_add_promoter_language'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Update daily_km_logs photo columns to LONGTEXT to support base64 encoded images.
    
    Base64 images can be 100KB+ characters, VARCHAR(500) is insufficient.
    """
    # Update start_km_photo to LONGTEXT
    op.alter_column(
        'daily_km_logs',
        'start_km_photo',
        existing_type=mysql.VARCHAR(500),
        type_=mysql.LONGTEXT(),
        existing_nullable=True
    )
    
    # Update end_km_photo to LONGTEXT
    op.alter_column(
        'daily_km_logs',
        'end_km_photo',
        existing_type=mysql.VARCHAR(500),
        type_=mysql.LONGTEXT(),
        existing_nullable=True
    )


def downgrade() -> None:
    """
    Revert photo columns to VARCHAR(500).
    
    WARNING: This will truncate any base64 images longer than 500 characters!
    """
    # Revert start_km_photo to VARCHAR(500)
    op.alter_column(
        'daily_km_logs',
        'start_km_photo',
        existing_type=mysql.LONGTEXT(),
        type_=mysql.VARCHAR(500),
        existing_nullable=True
    )
    
    # Revert end_km_photo to VARCHAR(500)
    op.alter_column(
        'daily_km_logs',
        'end_km_photo',
        existing_type=mysql.LONGTEXT(),
        type_=mysql.VARCHAR(500),
        existing_nullable=True
    )
