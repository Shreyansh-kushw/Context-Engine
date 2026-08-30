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
from app.services.s3_client import s3, BUCKET_NAME

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
    #     filepath = Path(
    #         f"upload_files/{job_id+str(index+1)}{Path(file.filename).suffix}"
    #     )  # creating the relative filepath

    #     with open(filepath, "wb") as f:
    #         content = await file.read()  # reading the file content
    #         f.write(content)  # copying the file content to another file

    #     background_tasks.add_task(ingestion_pipeline, filepath, db, job_id)

        try: 

            s3_key = f"{job_id+str(index+1)}{Path(file.filename).suffix}"

            s3.upload_fileobj(
                file.file,
                BUCKET_NAME,
                s3_key,
                ExtraArgs={
                    "ContentType": file.content_type,
                },
            )

            filename = Path(s3_key).name

            with tempfile.TemporaryDirectory() as tmpdir:

                local_path = Path(tmpdir) / filename

                s3.download_file(
                    BUCKET_NAME,
                    s3_key,
                    str(local_path),
                )

                background_tasks.add_task(ingestion_pipeline, local_path, db, job_id)

        except Exception as e:
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
