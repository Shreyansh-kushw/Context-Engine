from docling.document_converter import DocumentConverter, PdfFormatOption
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import (
    PdfPipelineOptions,
    EasyOcrOptions,
)
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import fitz

from app.services.chunker import generate_chunks
from app.services import embedder
from app.models import Chunks


# Helper Pipelines


def pdf_pipeline(filepath: Path):
    """Processes a PDF file and returns the chunks of the extracted text"""

    # initializing the PDF pipeline
    pipeline_options = PdfPipelineOptions()
    pipeline_options.do_ocr = True
    pipeline_options.ocr_options = EasyOcrOptions()

    # initializing the docling converter
    converter = DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
        }
    )

    # getting the total number of pages in pdf - for batching
    doc = fitz.open(filepath)
    page_count = doc.page_count
    doc.close()

    # checking if there is any need for batching.
    batching = True if page_count > 10 else False

    if batching:  # batching logic
        final_chunks = []
        for start in range(1, page_count + 1, 10):
            end = min(start + 9, page_count)
            print(f"Processing pages: {start}-{end}")

            result = converter.convert(filepath, page_range=(start, end))
            chunks = generate_chunks(dl_doc=result.document)
            final_chunks.extend(chunks)

        return final_chunks

    result = converter.convert(filepath)
    return generate_chunks(dl_doc=result.document)


def image_and_text_pipeline(filepath: Path):
    """Processes the text and image files and returns the chunks of the extracted text"""

    # initializing the converter
    converter = DocumentConverter()

    return generate_chunks(dl_doc=converter.convert(filepath).document)


# Main data ingestion pipeline


async def ingestion_pipeline(filepath: Path, db: AsyncSession):
    """The main ingest data pipeline"""

    # getting the filename and filetype
    filename = filepath.name
    file_ext = filepath.suffix

    # calling the proper pipeline based on filetype
    if file_ext.lower() == ".pdf":  # pdf pipeline
        chunks = pdf_pipeline(filepath)

    elif file_ext.lower() in {
        ".txt",
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".bmp",
        ".webp",
        ".tiff",
        ".tif",
    }:  # image and text pipeline
        chunks = image_and_text_pipeline(filepath)

    else:  # unsupported file type
        raise ValueError(f"Unsupported file type: {file_ext}")

    # generating embeddings and adding to the table in database
    embeddings = embedder.generate_embeddings([chunk.text for chunk in chunks])

    for chunk, embedding in zip(chunks, embeddings):
        new_chunk_field = Chunks(
            filename=filename, chunk_text=chunk.text, embedding=embedding
        )

        db.add(new_chunk_field)

    try:
        await db.commit()

    except Exception:
        await db.rollback()
        raise Exception


# Main retrieval pipeline


async def retrieval_pipeline(
    query: str,
    filename: str,
    db: AsyncSession
):
    """Main retrieval pipeline"""

    # generating embeddings for the query
    query_embedding = embedder.generate_embeddings(query)

    # getting all the database fields with the given filename. 
    results = await db.execute(
        select(Chunks)
        .where(Chunks.filename == filename)
        .order_by(Chunks.embedding.cosine_distance(query_embedding))
        .limit(5)
    )

    chunk_fields = results.scalars().all()
    chunk_texts = [chunk.chunk_text for chunk in chunk_fields]

    
    