from typing import Annotated
from fastapi import BackgroundTasks, Depends, FastAPI, File, UploadFile, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import Field
import uuid

from app.services.pipelines import ingestion_pipeline, retrieval_pipeline
from app.database import get_db
from app.schema import QueryRequest

app = FastAPI()

jobs = {}
UPLOAD_DIR = Path("upload_files")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

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
    jobs[job_id] = {"status": "Processing"}

    for index, file in enumerate(files):
        try:
            filepath = UPLOAD_DIR / f"{job_id}{str(index+1)}{Path(file.filename).suffix}"

            content = await file.read()
            with open(filepath, "wb") as f:
                f.write(content)

            background_tasks.add_task(ingestion_pipeline, filepath, db, job_id, jobs)

        except Exception as e:
            jobs[job_id] = {"status": "Failed"}
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    return {"job_id": str(job_id), "message": "Files uploaded successfully"}

@app.post("/qna")
async def ques_answer(
    request: QueryRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Endpoint to generate response for the asked query"""

    response = await retrieval_pipeline(request.query, request.job_id, db)
    return response

@app.get("/status/{job_id}")
async def get_status(job_id: str):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return job.get("status")