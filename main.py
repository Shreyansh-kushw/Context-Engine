from typing import Annotated
from fastapi import FastAPI, File, UploadFile, Depends
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.services.pipelines import ingestion_pipeline
from app.database import get_db

app = FastAPI()


@app.post("/upload-file")
async def upload_file(
    file: Annotated[UploadFile, File(description="File to be analysed.")],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    filename = str(uuid.uuid4().hex)  # creating random filenames.
    filepath = Path(f"upload_files/{filename}{Path(file.filename).suffix}")  # creating the relative filepath

    with open(filepath, "wb") as f:
        content = await file.read()  # reading the file content
        f.write(content)  # copying the file content to another file

    await ingestion_pipeline(filepath, db)
