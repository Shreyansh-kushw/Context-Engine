from pgvector.sqlalchemy import Vector
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer, String, Text

from app.database import Base


class Chunks(Base):

    """Chunks table model for the database"""

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index= True
    )

    filename: Mapped[str] = mapped_column(
        String,
        unique=True,
        nullable=False,
        index=True
    )

    Chunks: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    Embedding: Mapped[Vector] = mapped_column(
        Vector(384),
        nullable=False,
    )