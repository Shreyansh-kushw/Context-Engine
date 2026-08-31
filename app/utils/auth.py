import os
import secrets
from typing import Annotated

from fastapi import APIKeyHeader, Depends, HTTPException, status

API_KEY = os.getenv("API_KEY")

api_key_header = APIKeyHeader(name="X-API-KEY")


async def verify_api_key(
    api_key: Annotated[str, Depends(api_key_header)],
):
    if not api_key or not secrets.compare_digest(api_key, API_KEY):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API Key"
        )

    return api_key
