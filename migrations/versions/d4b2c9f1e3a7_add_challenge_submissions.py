"""add_challenge_submissions

Revision ID: d4b2c9f1e3a7
Revises: c3a1f8e92d45
Create Date: 2026-10-07 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd4b2c9f1e3a7'
down_revision: Union[str, Sequence[str], None] = 'c3a1f8e92d45'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'challenge_submissions',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('challenge_id', sa.Integer(), nullable=False),
        sa.Column('proof_url', sa.String(), nullable=False),
        sa.Column('note', sa.Text(), nullable=True),
        sa.Column('status', sa.Enum('pending', 'approved', 'rejected', name='challenge_status'), nullable=False),
        sa.Column('submitted_at', sa.DateTime(), nullable=False),
        sa.Column('reviewed_at', sa.DateTime(), nullable=True),
        sa.Column('reviewer_id', sa.String(), nullable=True),
        sa.Column('reviewer_notes', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['reviewer_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    op.drop_table('challenge_submissions')
    op.execute("DROP TYPE IF EXISTS challenge_status")
