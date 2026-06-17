# 🔍 Context Engine

> Upload any document. Ask anything about it. Get accurate, grounded answers.

[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)
![Python](https://img.shields.io/badge/Language-Python_3.12+-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/API-FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![pgvector](https://img.shields.io/badge/Vector_Search-pgvector-6C63FF?style=flat-square)
![Groq](https://img.shields.io/badge/LLM-Groq_(Llama--3)-F55036?style=flat-square)

Most LLMs can't answer questions about your specific documents — they either hallucinate or simply don't have the context. Context Engine solves this by building a full RAG (Retrieval-Augmented Generation) pipeline that ingests your documents, stores them as semantic vector embeddings, and retrieves only the most relevant context before passing it to an LLM — so answers are always grounded in your actual content, never fabricated.

---

## ⚙️ How It Works

```
Upload File → Parse & Chunk → Embed → Store in pgvector
     ↓
  Query → Embed Query → Cosine Similarity Search → Retrieve Top Chunks → LLM → Answer
```

Two clean endpoints. Upload once, query as many times as you want.

---

## ✨ Features

- **Multi-format ingestion** — PDFs (with batching for large files), plain text, and images (JPG, PNG, GIF, BMP, WEBP, TIFF)
- **OCR support** — extracts text from scanned PDFs and images using EasyOCR
- **Hybrid semantic chunking** — uses Docling with a HuggingFace tokenizer for structure-aware splitting, not naive character splits
- **Local embeddings** — `BAAI/bge-base-en-v1.5` via SentenceTransformers, 768-dimensional vectors, runs fully offline
- **pgvector similarity search** — cosine distance search over PostgreSQL, no separate vector DB required
- **Fully async** — async SQLAlchemy, async FastAPI endpoints, async LangChain calls throughout — no blocking I/O
- **LLM via Groq** — fast inference, swap models via a single env variable

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Web Framework** | FastAPI + Uvicorn |
| **Database** | PostgreSQL + pgvector extension |
| **ORM & Migrations** | SQLAlchemy (asyncpg) + Alembic |
| **Embeddings** | SentenceTransformers (`BAAI/bge-base-en-v1.5`) |
| **Document Parsing** | Docling + EasyOCR |
| **LLM Orchestration** | LangChain + Groq API |
| **Dependency Management** | uv |
| **Runtime** | Python 3.12+ |

---

## 📁 Project Structure

```
.
├── main.py                  # FastAPI app and route definitions
├── alembic/                 # Database migration scripts
├── app/
│   ├── database/            # Async engine, session factory, DB dependencies
│   ├── models/              # SQLAlchemy models (Chunks with pgvector column)
│   ├── schema/              # Pydantic schemas for request validation
│   ├── services/
│   │   ├── chunker.py       # Hybrid chunking via Docling + HuggingFace tokenizer
│   │   ├── embedder.py      # Local SentenceTransformer embedding generation
│   │   ├── llm_service.py   # LangChain + Groq chain construction
│   │   └── pipelines.py     # Ingestion and retrieval pipeline orchestration
│   └── utils/
│       └── config.py        # Environment variable validation via pydantic-settings
├── pyproject.toml           # Project dependencies (uv)
├── upload_files/            # Local storage for uploaded documents
└── .env                     # Environment config (not committed)
```

---

## 🚀 Setup

### 📋 Prerequisites

- Python 3.12+
- PostgreSQL with the `pgvector` extension installed
- [uv](https://github.com/astral-sh/uv) (`curl -LsSf https://astral.sh/uv/install.sh | sh`)
- A Groq API key from [console.groq.com](https://console.groq.com/keys)

### 📥 Installation

```bash
git clone <repository-url>
cd context-engine
uv sync
```

### 📄 Environment Variables

Create a `.env` file in the root:

```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/dbname
DATABASE_URL_ALEMBIC=postgresql://user:password@localhost:5432/dbname
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | Async connection string for SQLAlchemy (asyncpg driver) |
| `DATABASE_URL_ALEMBIC` | Sync connection string for Alembic migrations |
| `GROQ_API_KEY` | Your Groq API key |
| `GROQ_MODEL` | Groq model ID — recommended: `llama-3.1-8b-instant` or `llama-3.3-70b-versatile` |

### 🗄️ Database Setup

```bash
# Enable pgvector in your PostgreSQL database
psql -d your_db -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Run migrations
uv run alembic upgrade head
```

### ▶️ Run

```bash
uv run fastapi dev main.py
```

Server runs at `http://localhost:8000`. Interactive API docs at `http://localhost:8000/docs`.

---

## 📡 API

### `POST /upload-file`

Uploads and ingests a document. The file is parsed, chunked, embedded, and stored in the vector database.

**Request** — `multipart/form-data`

| Field | Type | Description |
|---|---|---|
| `file` | File | Document to ingest (`.pdf`, `.txt`, `.png`, `.jpg`, etc.) |

**Example**
```bash
curl -X POST 'http://localhost:8000/upload-file' \
  -H 'accept: application/json' \
  -F 'file=@document.pdf'
```

**Response**
```json
{
  "filename": "a1b2c3d4e5f6.pdf",
  "message": "File uploaded successfully"
}
```

> Save the returned `filename` — you'll need it to query the document.

---

### `POST /qna`

Queries a previously uploaded document. Retrieves the most relevant chunks via cosine similarity search and generates a grounded answer via the configured LLM.

#### Retrieval Pipeline

1. Embed user query using BGE-base
2. Perform cosine similarity search in pgvector
3. Retrieve top-k chunks
4. Pass retrieved context + user query to LLM
5. Generate grounded response

**Request** — `application/json`

```json
{
  "query": "string",
  "filename": "string"
}
```

**Example**
```bash
curl -X POST 'http://localhost:8000/qna' \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "What are the key findings in this document?",
    "filename": "a1b2c3d4e5f6.pdf"
  }'
```

**Response**
```json
"The key findings include..."
```

---

## Deployment Note
Context Engine requires significant RAM due to local embedding models 
(SentenceTransformers) and OCR (EasyOCR). Recommended minimum: 2GB RAM.
Free tier deployment is not currently supported. 
Run locally using the setup instructions above.

---

## 🛠️ Engineering Notes

A few non-obvious problems that came up during development:

**Async LLM calls blocking the event loop** — naive LangChain usage with `.invoke()` inside async FastAPI routes blocks the entire event loop during LLM inference, which can take several seconds. Fixed by using `.ainvoke()` throughout the retrieval pipeline, keeping all I/O genuinely non-blocking.

**Vector column dimension mismatch with Alembic** — switching embedding models mid-development (384 → 768 dimensions) caused Alembic `ALTER COLUMN` to fail on existing data. PostgreSQL won't cast between vector dimensions in-place. Fix was to drop and recreate the column in the migration rather than alter it, then re-embed existing documents.

**Chunking strategy matters more than model choice** — early testing showed retrieval quality was more sensitive to chunk size and overlap than to which LLM was used for generation. Hybrid chunking with Docling's structure-aware splitting significantly outperformed naive character-based splitting on multi-section PDFs.