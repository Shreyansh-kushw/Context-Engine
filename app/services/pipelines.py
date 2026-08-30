from docling.document_converter import DocumentConverter, PdfFormatOption
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import (
    PdfPipelineOptions,
    EasyOcrOptions,
)
from docling.backend.pypdfium2_backend import PyPdfiumDocumentBackend

from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import fitz

from app.services.chunker import generate_chunks, chunker
from app.services import embedder
from app.models import Chunks
from app.services.llm_service import generate_response

# Helper Pipelines


def pdf_pipeline(filepath: Path,):
    """Processes a PDF file and returns the chunks of the extracted text"""

    # initializing the PDF pipeline
    pipeline_options = PdfPipelineOptions()
    pipeline_options.do_ocr = True
    pipeline_options.ocr_options = EasyOcrOptions()

    # initializing the docling converter
    converter = DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(
                pipeline_options=pipeline_options,
                backend=PyPdfiumDocumentBackend,  # Using PyPdfiumDocumentBackend to fix utf-8 codec error
            )
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


async def ingestion_pipeline(filepath: Path, db: AsyncSession, job_id: str, jobs: dict):
    """The main ingest data pipeline"""

    try:
        # getting the filename and filetype
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
            jobs[job_id]["status"] = "Failed"
            raise ValueError(f"Unsupported file type: {file_ext}")

        # generating embeddings and adding to the table in database
        embeddings = embedder.generate_embeddings([chunker.contextualize(chunk) for chunk in chunks])

        for chunk, embedding in zip(chunks, embeddings):
            new_chunk_field = Chunks(
                job_id=job_id, chunk_text=chunker.contextualize(chunk), embedding=embedding
            )

            db.add(new_chunk_field)

        try:
            await db.commit()
            jobs[job_id]["status"] = "Success"

        except Exception:
            jobs[job_id]["status"] = "Failed"
            await db.rollback()
            raise

    except Exception:
        jobs[job_id]["status"] = "Failed"
        raise

    finally:
        # Clean up local file from upload_files directory
        if filepath.exists():
            filepath.unlink(missing_ok=True)


# Main retrieval pipeline


async def retrieval_pipeline(query: str, job_id: str, db: AsyncSession):
    """Main retrieval pipeline"""

    # generating embeddings for the query
    query_embedding = embedder.generate_embeddings(query)

    # getting all the database fields with the given filename.
    results = await db.execute(
        select(Chunks)
        .where(Chunks.job_id == job_id)
        .order_by(Chunks.embedding.cosine_distance(query_embedding))
        .limit(5)
    )

    chunk_fields = results.scalars().all()

    if not chunk_fields:

        raise ValueError("Job ID not")

    chunk_texts = [chunk.chunk_text for chunk in chunk_fields]

    response = await generate_response(chunks=chunk_texts, question=query)
    return response
