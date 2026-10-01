"""add is_verified to users

Revision ID: c3a1f8e92d45
Revises: b9cb8680a3c4
Create Date: 2026-10-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'c3a1f8e92d45'
down_revision = 'b9cb8680a3c4'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    op.drop_column('users', 'is_verified')
