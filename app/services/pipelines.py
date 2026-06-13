from docling.document_converter import DocumentConverter, PdfFormatOption
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import (
    PdfPipelineOptions,
    EasyOcrOptions,
)
import fitz

from app.services.chunker import generate_chunks


def pdf_pipeline(filepath: str) -> str:
    """Processes a PDF file and returns the extracted text as markdown."""

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
        final_markdown = []

        for start in (1, page_count + 1, 10):
            end = min(start + 9, page_count)
            print(f"Processing pages: {start}-{end}")

            result = converter.convert(filepath, page_range=(start, end))

            final_markdown.append(result.document.export_to_markdown())

        return "\n\n".join(final_markdown)

    result = converter.convert(filepath)
    return generate_chunks(dl_doc=result.document)


def image_pipeline(filepath: str) -> str:
    """Processes the images and returns the extracted text as markdown."""

    # initializing the converter
    converter = DocumentConverter()

    return generate_chunks(dl_doc=converter.convert(filepath).document)


def text_pipeline(filepath: str) -> str:
    """Processes the text files and returns the extracted text as markdown."""

    # initializing the converter
    converter = DocumentConverter()

    return generate_chunks(dl_doc=converter.convert(filepath).document)
