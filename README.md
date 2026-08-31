# Context Engine 🔍

> A high-performance, full-stack RAG engine for multi-document ingestion, semantic search, and grounded question answering.

[![LIVE DEMO](https://img.shields.io/badge/LIVE_DEMO-Visit_Now-blue?style=for-the-badge)](https://context-engine-alpha.vercel.app/)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-black?style=for-the-badge&logo=github)](https://github.com/Shreyansh-kushw/Context-Engine)
    
![Python](https://img.shields.io/badge/Language-Python_|_TypeScript-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Frontend-Next.js-black?style=flat-square&logo=next.js)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![pgvector](https://img.shields.io/badge/Vector_Search-pgvector-6C63FF?style=flat-square)
![Groq](https://img.shields.io/badge/LLM-Groq_(Llama--3.3)-F55036?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

**Context Engine** is a full-stack Retrieval-Augmented Generation (RAG) platform built with Next.js, FastAPI, and PostgreSQL with pgvector. Most LLMs hallucinate or lack context when queried about specific documents. Context Engine solves this by providing a scalable multi-document ingestion pipeline that extracts content across diverse formats, chunks documents using structure-aware tokenization, indexes them with local semantic vector embeddings, and retrieves relevant context to deliver accurate, grounded answers powered by Groq.


## 🚀 Key Features

- **Multi-Document Ingestion & Background Processing:** Upload multiple files at once with asynchronous background processing and live job status polling (`/status/{job_id}`).
- **OCR & Multi-Format Parsing:** Ingests PDFs (with batching for large files), plain text, and image formats (JPG, PNG, GIF, BMP, WEBP, TIFF) via Docling and EasyOCR.
- **Hybrid Semantic Chunking:** Structure-aware document splitting using Docling and HuggingFace tokenizers to preserve document layout and context.
- **Local Offline Embeddings:** Generates 768-dimensional embeddings with `BAAI/bge-base-en-v1.5` via SentenceTransformers running locally.
- **pgvector Similarity Search:** High-performance cosine distance similarity retrieval directly inside PostgreSQL without requiring a separate vector database.
- **Fast Async LLM Inference:** Powered by Groq API (`llama-3.3-70b-versatile`) orchestrated with LangChain for low-latency question answering.
- **Modern Full-Stack UI:** Modern Next.js 16 (App Router) frontend with live indexing feedback, Markdown rendering, and an interactive chat interface.

---

## 🛠️ Tech Stack

### Backend
| Technology | Description | Version |
|---|---|---|
| **FastAPI** | High-performance async Python web framework | `>=0.136.3` |
| **PostgreSQL & asyncpg** | Primary database with async driver | `>=0.31.0` |
| **pgvector** | Open-source vector similarity search for PostgreSQL | `>=0.4.2` |
| **SQLAlchemy (Async)** | Modern ORM with `Mapped` typed columns | `>=2.0.50` |
| **Docling & EasyOCR** | Multi-format document parser, structure-aware chunker, and OCR | `>=2.100.0` / `>=1.7.2` |
| **SentenceTransformers** | Local 768-dim embedding generation (`BAAI/bge-base-en-v1.5`) | `>=5.5.1` |
| **LangChain & Groq** | LLM orchestration and ultra-fast inference (`openai/gpt-oss-120b`) | `>=1.3.9` / `>=1.1.3` |
| **Alembic** | Database migrations management | `>=1.18.4` |

### Frontend
| Technology | Description | Version |
|---|---|---|
| **Next.js** | React framework (App Router) | `^16.3.3` |
| **React** | UI library | `^19.0.0` |
| **Tailwind CSS** | Utility-first CSS styling framework | `^4.3.3` |
| **Lucide React** | Modern icon set | `^1.16.0` |
| **React Markdown & Remark GFM** | Rich markdown rendering for AI responses | `^10.1.0` & `^4.0.1` |

---

## 🚦 Quick Start

Follow these steps to run Context Engine locally.

### Prerequisites
- Python >= 3.12
- Node.js >= 20 & `npm`
- PostgreSQL with the `pgvector` extension installed
- `uv` (Fast Python package installer)
- Groq API Key from [console.groq.com](https://console.groq.com/keys)

### 1. Database Setup
Ensure PostgreSQL is running and enable the vector extension:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 2. Environment Variables
Create a `.env` file in the root directory for the backend and `frontend/.env.local` for the frontend.

**Root `.env` (Backend):**
| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | Async PostgreSQL connection string (`asyncpg`) | `postgresql+asyncpg://user:pass@localhost:5432/context_engine` |
| `DATABASE_URL_ALEMBIC` | Sync PostgreSQL connection string for Alembic (`psycopg`) | `postgresql+psycopg://user:pass@localhost:5432/context_engine` |
| `GROQ_API_KEY` | Your Groq API key | `gsk_...` |
| `GROQ_MODEL` | Groq LLM model ID | `openai/gpt-oss-120b` |

**`frontend/.env.local` (Frontend):**
| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API Base URL | `http://localhost:8000` |

### 3. Backend Setup
```bash
# Install dependencies using uv
uv sync

# Run database migrations
alembic upgrade head

# Start the FastAPI development server
uv run uvicorn main:app --reload
```
*The backend API will be available at [http://localhost:8000](http://localhost:8000) (Interactive Swagger docs at [http://localhost:8000/docs](http://localhost:8000/docs)).*

### 4. Frontend Setup
```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the Next.js development server
npm run dev
```
*The frontend application will be available at [http://localhost:3000](http://localhost:3000).*

### 5. Docker Setup (Optional)
```bash
# Build the Docker image
docker build -t context-engine .

# Run the container with environment variables
docker run -p 8000:8000 --env-file .env context-engine
```

---

## 📂 Project Structure

```
Context-Engine/
├── app/
│   ├── database/        # Async database engine, session factory, Base model
│   ├── models/          # SQLAlchemy models (Chunks with pgvector column)
│   ├── schema/          # Pydantic models (QueryRequest)
│   ├── services/
│   │   ├── chunker.py   # Hybrid chunking via Docling & HF tokenizer
│   │   ├── embedder.py  # Local SentenceTransformer embeddings (BGE-base)
│   │   ├── llm_service.py # LangChain + Groq chain construction
│   │   └── pipelines.py # Ingestion (PDF/OCR/Images) & Retrieval pipelines
│   └── utils/
│       └── config.py    # Pydantic Settings configuration
├── frontend/
│   ├── app/             # Next.js App Router (upload, chat, layout)
│   ├── components/      # UI components & widgets
│   ├── lib/             # API client, status polling, utility helpers
│   ├── public/          # Static assets & icons
│   ├── package.json     # Frontend dependencies (npm)
│   └── tsconfig.json    # TypeScript configuration
├── alembic/             # Database migration scripts
├── upload_files/        # Temporary storage for processing files
├── alembic.ini          # Alembic configuration
├── dockerfile           # Docker container configuration
├── main.py              # FastAPI application entry point & routes
├── pyproject.toml       # Backend dependencies (uv)
├── requirements.txt     # Exported Python dependencies
├── uv.lock              # uv lockfile
└── .python-version      # Python version specification
```

---

## 🏗️ Architecture

```mermaid
graph TD
    Client["Next.js Frontend"] -->|"1. Upload Files"| API["FastAPI Backend"]
    API -->|"2. Spawn Task & Return job_id"| Ingest["Background Ingestion Task"]
    
    Ingest -->|"Parse & OCR"| Docling["Docling + EasyOCR"]
    Docling -->|"Hybrid Chunking"| Chunker["Docling Chunker"]
    Chunker -->|"768-dim Vectors"| Embedder["SentenceTransformers (BGE-base)"]
    Embedder -->|"Store Embeddings"| DB[("PostgreSQL + pgvector")]
    
    Client -->|"3. Poll Status (/status)"| API
    Client -->|"4. Ask Query (/qna)"| API
    API -->|"5. Embed Query"| Embedder
    API -->|"6. Cosine Search"| DB
    DB -->|"7. Top Chunks"| Retrieval["Retrieval Pipeline"]
    Retrieval -->|"8. Context + Prompt"| Groq["Groq API (LLaMA 3.3)"]
    Groq -->|"9. Answer"| API
    API -->|"10. Response"| Client
```

---

## 📡 API Endpoints Reference

### Ingestion & Status
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/upload-files` | Upload multiple files and trigger asynchronous background ingestion | No |
| `GET` | `/status/{job_id}` | Check status of document ingestion job (`Processing`, `Success`, `Failed`) | No |

### Question Answering
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/qna` | Query ingested documents for a specific `job_id` | No |

---

### Endpoint Details

#### `POST /upload-files`
Uploads documents for analysis. Returns a `job_id` immediately while parsing, chunking, and embedding run asynchronously in the background.

**Request:** `multipart/form-data` with `files` (array of uploaded files).

**Example:**
```bash
curl -X POST 'http://localhost:8000/upload-files' \
  -F 'files=@document.pdf' \
  -F 'files=@notes.png'
```

**Response:**
```json
{
  "job_id": "a1b2c3d4e5f67890",
  "message": "Files uploaded successfully"
}
```

---

#### `GET /status/{job_id}`
Checks the current processing status for an upload job.

**Example:**
```bash
curl -X GET 'http://localhost:8000/status/a1b2c3d4e5f67890'
```

**Response:**
```json
"Success"
```

---

#### `POST /qna`
Queries all documents associated with a `job_id`. Retrieves the top-5 most relevant chunks via cosine similarity search and generates a grounded response.

**Request:** `application/json`
```json
{
  "query": "What are the primary findings in the uploaded document?",
  "job_id": "a1b2c3d4e5f67890"
}
```

**Example:**
```bash
curl -X POST 'http://localhost:8000/qna' \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "What are the primary findings in the uploaded document?",
    "job_id": "a1b2c3d4e5f67890"
  }'
```

**Response:**
```json
"The primary findings include..."
```

---

## 🧠 Data Flow: End-to-End RAG Pipeline

```mermaid
sequenceDiagram
    participant User as User / Frontend
    participant FastAPI as FastAPI Backend
    participant Docling as Docling & EasyOCR
    participant Embedder as SentenceTransformers
    participant DB as PostgreSQL (pgvector)
    participant Groq as Groq API (LLaMA 3.3)

    User->>FastAPI: POST /upload-files (Documents)
    FastAPI-->>User: Returns job_id (Processing in background)
    FastAPI->>Docling: Parse PDF / Image / OCR & Hybrid Chunk
    Docling->>Embedder: Generate 768-dim vector embeddings
    Embedder->>DB: Store Chunks (job_id, chunk_text, embedding)

    loop Polling Status
        User->>FastAPI: GET /status/{job_id}
        FastAPI-->>User: Processing / Success
    end

    User->>FastAPI: POST /qna (query, job_id)
    FastAPI->>Embedder: Generate query embedding (768-dim)
    FastAPI->>DB: Cosine distance query (Top-5 chunks by job_id)
    DB-->>FastAPI: Top-5 relevant chunks
    FastAPI->>Groq: Generate answer (context chunks + query)
    Groq-->>FastAPI: Grounded response
    FastAPI-->>User: Final answer
```

- **OCR & Document Parsing:** Docling processes text and images, leveraging EasyOCR for scanned pages and automatic 10-page batching for multi-page PDFs.
- **Contextual Chunking:** Chunker preserves structural headings and paragraphs rather than splitting on raw character counts.
- **Local Embedding:** Vectors are generated offline using `BAAI/bge-base-en-v1.5` (768 dimensions).
- **Fast Similarity Search:** PostgreSQL executes cosine distance search directly on indexed vectors.
- **Grounded Generation:** LangChain sends retrieved context to Groq's high-speed `llama-3.3-70b-versatile` endpoint.

---

## 🗄️ Database Schema

Context Engine uses declarative SQLAlchemy 2.0 async ORM models with `pgvector`.

- **`Chunks` Table:** Stores chunk text along with its associated `job_id` and an `embedding` column of type `Vector(768)`.

```python
class Chunks(Base):
    """Chunks table model for the database"""

    __tablename__ = "chunks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    job_id: Mapped[str] = mapped_column(
        String, unique=False, nullable=False, index=True
    )

    chunk_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    embedding: Mapped[Vector] = mapped_column(
        Vector(768),
        nullable=False,
    )
```

---

## 🚀 Deployment Instructions

### Backend Deployment (e.g., Render, Railway, AWS ECS)
1. Provision a PostgreSQL instance with the `pgvector` extension enabled (e.g., Supabase, Neon, AWS RDS).
2. Set the `DATABASE_URL` and `DATABASE_URL_ALEMBIC` environment variables.
3. Configure `GROQ_API_KEY` and `GROQ_MODEL`.
4. Deploy using the provided `dockerfile` or run with Uvicorn:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2
   ```
   > **Note:** Because SentenceTransformers and Docling run locally, a minimum of 2GB RAM is recommended.

### Frontend Deployment (e.g., Vercel)
1. Connect your repository to Vercel and select the `frontend` directory as the root.
2. Set the build command to `npm run build` and install command to `npm install`.
3. Add the `NEXT_PUBLIC_API_URL` environment variable pointing to your deployed FastAPI backend.
4. Deploy!

---

## 🔧 Troubleshooting

- **`pgvector` Extension Error:** If you get an error about `type "vector" does not exist`, ensure you ran `CREATE EXTENSION IF NOT EXISTS vector;` on your Postgres database before running Alembic migrations.
- **CORS Issues:** Make sure your frontend's URL (e.g., `http://localhost:3000` or production URL) is configured in `allow_origins` inside `main.py`.
- **Memory Optimization:** SentenceTransformers and Docling require sufficient memory during model loading and OCR parsing. For containerized environments, ensure at least 2GB of RAM is allocated.

---

## 🎓 What I Learned

Building Context Engine provided valuable insights into production RAG pipelines:
- **Asynchronous Ingestion Workflows:** Decoupling heavy file ingestion (OCR, chunking, and embedding generation) into background tasks with a status polling endpoint ensures the API remains fast and non-blocking.
- **Structure-Aware Chunking:** Retrieval quality is heavily determined by chunking strategy. Utilizing Docling with tokenizer-aware boundaries preserves semantic context significantly better than naive fixed-character splits.
- **Embedded Vector Search with pgvector:** Storing 768-dimensional embeddings directly in PostgreSQL using `pgvector` eliminates the operational complexity of managing a separate vector database while maintaining sub-millisecond retrieval speeds.
- **Exact vs. Approximate Search (Why No HNSW):** Approximate Nearest Neighbor (ANN) indexes like HNSW are ideal for global table scans, but unnecessary for scoped document retrieval. Because queries are already filtered by `job_id`, the search space is narrowed down to a small candidate set (tens to hundreds of chunks). Exact cosine distance calculation over this filtered subset executes in sub-milliseconds, provides 100% recall with zero approximation loss, and avoids the memory and write latency of building graph indexes during file ingestion.
- **Async LLM Orchestration:** Leveraging `.ainvoke()` in LangChain and async SQLAlchemy sessions prevents event loop blocking, enabling high-concurrency request handling.

---
*Built with ❤️ using FastAPI, Next.js, and PostgreSQL*