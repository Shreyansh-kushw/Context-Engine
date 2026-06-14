"""updated vector dimensions in database

Revision ID: c05091141b10
Revises: 84fedeb34456
Create Date: 2026-06-14 12:51:23.882093

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector

# revision identifiers, used by Alembic.
revision: str = 'c05091141b10'
down_revision: Union[str, Sequence[str], None] = '84fedeb34456'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.drop_column('chunks', 'embedding')
    op.add_column('chunks', sa.Column('embedding', Vector(768), nullable=True))

def downgrade():
    op.drop_column('chunks', 'embedding')
    op.add_column('chunks', sa.Column('embedding', Vector(384), nullable=True))
