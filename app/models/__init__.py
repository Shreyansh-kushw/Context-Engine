from pgvector.sqlalchemy import Vector
from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Chunks(Base):
    """Chunks table model for the database"""

    __tablename__ = "chunks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    job_id: Mapped[str] = mapped_column(
        String, unique=False, nullable=False, index=True
    )

    source_filename: Mapped[str] = mapped_column(String, nullable=False)

    chunk_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    page_number: Mapped[int | None] = mapped_column(Integer, nullable=True)

    embedding: Mapped[Vector] = mapped_column(
        Vector(768),
        nullable=False,
    )


class Jobs(Base):

    __tablename__ = "jobs"
    job_id: Mapped[str] = mapped_column(String, primary_key=True)
    owner_token: Mapped[str] = mapped_column(String, index=True, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False, default="Processing")
