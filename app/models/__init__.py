from pgvector.sqlalchemy import Vector
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer, String, Text

from app.database import Base


class Chunks(Base):
    """Chunks table model for the database"""
    
    __tablename__ = "chunks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    filename: Mapped[str] = mapped_column(
        String, unique=False, nullable=False, index=True
    )

    chunk_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    embedding: Mapped[Vector] = mapped_column(
        Vector(384),
        nullable=False,
    )
