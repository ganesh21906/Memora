"""
Memora – FastAPI Backend
Exposes /query, /upload, /health, /reindex, and /vector/status endpoints.
"""
from __future__ import annotations

from pathlib import Path
from typing import Any

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.config import settings

app = FastAPI(
    title="Memora API",
    description="Context-Aware Personal Executive — Memory Layer",
    version="1.0.0",
)

# Allow Streamlit frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_index():
    """Index all existing files on server start if vector store is empty."""
    from backend.vector_store import count, is_available
    from backend.indexer import reindex_all
    if is_available() and count() == 0:
        results = reindex_all()
        indexed = sum(results.values())
        if indexed:
            print(f"[Memora] Auto-indexed {indexed} chunks from {len(results)} files.")


# ── Request / Response Models ─────────────────────────────────────────────────

class QueryRequest(BaseModel):
    query: str


class QueryResponse(BaseModel):
    answer: str
    tools_called: list[str]
    elapsed_seconds: float
    mode: str  # "demo" or "live"
    structured_truth: dict = {}
    conflicts: list[dict] = []


class UploadResponse(BaseModel):
    filename: str
    size_bytes: int
    message: str


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health")
def health() -> dict[str, Any]:
    """Health check endpoint."""
    return {
        "status": "ok",
        "mode": "demo" if settings.use_demo_mode else "live",
        "model": settings.llm_model,
    }


@app.get("/gmail/auth")
def gmail_auth() -> dict[str, str]:
    """
    Trigger Gmail OAuth flow. Opens a browser window for the user to approve access.
    Only needed once — the token is saved to credentials/gmail_token.json.
    """
    if settings.use_demo_mode:
        return {"status": "skipped", "message": "Set USE_DEMO_MODE=false in .env first."}
    try:
        from backend.gmail_client import _get_service
        _get_service()
        return {"status": "ok", "message": "Gmail authentication successful! Token saved."}
    except FileNotFoundError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gmail auth error: {e}")


@app.post("/query", response_model=QueryResponse)
def query_endpoint(req: QueryRequest) -> QueryResponse:
    """
    Main query endpoint.
    Runs the Memora agent and returns a synthesized answer.
    """
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    try:
        from backend.agent import run_agent
        result = run_agent(req.query)
    except EnvironmentError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent error: {e}")

    return QueryResponse(
        answer=result["answer"],
        tools_called=result["tools_called"],
        elapsed_seconds=result["elapsed_seconds"],
        mode="demo" if settings.use_demo_mode else "live",
        structured_truth=result.get("structured_truth", {}),
        conflicts=result.get("conflicts", []),
    )


@app.post("/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)) -> UploadResponse:
    """
    Upload a document (PDF, TXT, CSV) to the data/uploads/ directory.
    The agent will automatically search uploaded files on the next query.
    """
    allowed_extensions = {".pdf", ".txt", ".csv", ".md"}
    suffix = Path(file.filename or "").suffix.lower()

    if suffix not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{suffix}'. Allowed: {allowed_extensions}",
        )

    settings.uploads_dir.mkdir(parents=True, exist_ok=True)
    dest = settings.uploads_dir / (file.filename or "upload")

    contents = await file.read()
    dest.write_bytes(contents)

    # Index the file into the vector store
    chunks = 0
    try:
        from backend.indexer import index_file
        chunks = index_file(dest)
    except Exception:
        pass

    chunk_note = f" Indexed {chunks} chunks for semantic search." if chunks else ""
    return UploadResponse(
        filename=dest.name,
        size_bytes=len(contents),
        message=f"✅ '{dest.name}' uploaded successfully.{chunk_note}",
    )


@app.get("/uploads")
def list_uploads() -> dict[str, Any]:
    """List all uploaded files."""
    if not settings.uploads_dir.exists():
        return {"files": []}
    files = [
        {"name": f.name, "size_bytes": f.stat().st_size}
        for f in settings.uploads_dir.iterdir()
        if f.is_file() and not f.name.startswith(".")
    ]
    return {"files": files}


@app.post("/reindex")
def reindex() -> dict[str, Any]:
    """Re-index all files in data/ and data/uploads/ into the vector store."""
    from backend.indexer import reindex_all
    results = reindex_all()
    total = sum(results.values())
    return {
        "status": "ok",
        "files_indexed": len(results),
        "total_chunks": total,
        "details": results,
    }


@app.get("/vector/status")
def vector_status() -> dict[str, Any]:
    """Check vector store availability and chunk count."""
    from backend.vector_store import is_available, count
    available = is_available()
    return {
        "available": available,
        "chunks_stored": count() if available else 0,
        "engine": "ChromaDB (local, semantic search)" if available else "keyword search (fallback)",
    }
