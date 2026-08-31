import secrets
from pathlib import Path
from typing import Annotated

from fastapi import (
    BackgroundTasks,
    Depends,
    FastAPI,
    File,
    HTTPException,
    UploadFile,
    status,
)
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Jobs
from app.schema import QueryRequest
from app.services.pipelines import ingestion_pipeline, retrieval_pipeline
from app.utils.auth import verify_api_key, get_job_or_403, get_owner_token

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
    api_key: Annotated[str, Depends(verify_api_key)],
    owner_token: Annotated[str, Depends(get_owner_token)],
):
    """Endpoint to upload and ingest documents"""

    job_id = secrets.token_urlsafe(32)  # creating random job ids.
    # jobs[job_id] = {"status": "Processing"}

    new_job = Jobs(job_id=job_id,owner_token=owner_token)

    for index, file in enumerate(files):
        try:
            filepath = UPLOAD_DIR / f"{job_id}{index + 1!s}{Path(file.filename).suffix}"

            content = await file.read()
            with open(filepath, "wb") as f:
                f.write(content)

            background_tasks.add_task(ingestion_pipeline, filepath, db, job_id, jobs)

        except Exception as e:
            # jobs[job_id] = {"status": "Failed"}
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
            )

    return {"job_id": str(job_id), "message": "Files uploaded successfully"}


@app.post("/qna")
async def ques_answer(
    request: QueryRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    api_key: Annotated[str, Depends(verify_api_key)],
    owner_token: Annotated[str, Depends(get_owner_token)],
):
    """Endpoint to generate response for the asked query"""

    job_id = get_job_or_403(request.job_id, owner_token, db).job_id

    response = await retrieval_pipeline(request.query, job_id, db)
    return response


@app.get("/status/{job_id}")
async def get_status(
    job_id: str,
    api_key: Annotated[str, Depends(verify_api_key)],
    owner_token: Annotated[str, Depends(get_owner_token)],
):
    job = get_job_or_403(request.job_id, owner_token, db)
    
    return job.status
