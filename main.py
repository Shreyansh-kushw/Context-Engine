from typing import Annotated
from fastapi import BackgroundTasks, Depends, FastAPI, File, UploadFile
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import Field
import uuid

from app.services.pipelines import ingestion_pipeline, retrieval_pipeline
from app.database import get_db
from app.schema import QueryRequest

app = FastAPI()


@app.post("/upload-file")
async def upload_file(
    background_tasks: BackgroundTasks,
    file: Annotated[UploadFile, File(description="File to be analysed.")],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Endpoint to upload and ingest documents"""

    filename = str(uuid.uuid4().hex)  # creating random filenames.
    filepath = Path(
        f"upload_files/{filename}{Path(file.filename).suffix}"
    )  # creating the relative filepath

    with open(filepath, "wb") as f:
        content = await file.read()  # reading the file content
        f.write(content)  # copying the file content to another file

    background_tasks.add_task(ingestion_pipeline, filepath, db)

    return {"filename": str(filepath.name), "message": "File uploaded successfully"}

@app.post("/qna")
async def ques_answer(
    request: QueryRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Endpoint to generate response for the asked query"""

    response = await retrieval_pipeline(request.query, request.filename, db)
    return response
