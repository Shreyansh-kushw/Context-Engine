from typing import Annotated
from fastapi import BackgroundTasks, Depends, FastAPI, File, UploadFile
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import Field
import uuid

from fastapi.middleware.cors import CORSMiddleware
from app.services.pipelines import ingestion_pipeline, retrieval_pipeline
from app.database import get_db
from app.schema import QueryRequest

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://context-engine-alpha.vercel.app", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload-files")
async def upload_file(
    background_tasks: BackgroundTasks,
    files: Annotated[list[UploadFile], File(description="Files to be analysed.")],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Endpoint to upload and ingest documents"""

    job_id = str(uuid.uuid4().hex)  # creating random job ids.

    for index, file in enumerate(files):
        filepath = Path(
            f"upload_files/{job_id+str(index+1)}{Path(file.filename).suffix}"
        )  # creating the relative filepath

        with open(filepath, "wb") as f:
            content = await file.read()  # reading the file content
            f.write(content)  # copying the file content to another file

        background_tasks.add_task(ingestion_pipeline, filepath, db, job_id)

    return {"job_id": str(job_id), "message": "Files uploaded successfully"}

@app.post("/qna")
async def ques_answer(
    request: QueryRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Endpoint to generate response for the asked query"""

    response = await retrieval_pipeline(request.query, request.job_id, db)
    return response
