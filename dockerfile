FROM python:3.12-slim

WORKDIR /app

# Install system dependencies needed for python-magic, PyMuPDF, OCR, etc.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libmagic1 \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv package manager
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copy project dependency files first for layer caching
COPY pyproject.toml uv.lock .python-version ./

RUN uv sync --frozen

# Copy the rest of the application code
COPY . .

# Download and cache the embedding & reranker models during build time
RUN uv run python -c "from sentence_transformers import SentenceTransformer, CrossEncoder; SentenceTransformer('BAAI/bge-base-en-v1.5'); CrossEncoder('cross-encoder/ms-marco-MiniLM-L6-v2')"

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]