from typing import Annotated
from fastapi import FastAPI, File, UploadFile
import uuid
from pathlib import Path

app = FastAPI()


@app.post("/upload-file")
async def upload_file(
    file: Annotated[UploadFile, File(description="File to be analysed.")],
):
    filename = str(uuid.uuid4().hex)
    filepath = f"upload_files/{filename}{Path(file.filename).suffix}"

    with open(filepath, "wb") as f:
        content = await file.read()
        f.write(content)
