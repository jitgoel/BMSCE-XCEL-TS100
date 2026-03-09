"""
Resume routes — upload, fetch, and semantic search.
Parses resume directly using the extractor module (no NLP microservice hop).
"""

import os
import uuid
import aiofiles
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from dotenv import load_dotenv

from database import get_session
from models import Candidate
from vectorstore import store_resume_embedding, search_similar_candidates
from extractor import extract_resume_data

load_dotenv()

router = APIRouter()

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx"}


@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_session),
):
    """
    Upload a resume file, parse it directly, store results in PostgreSQL
    and embeddings in ChromaDB.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {ext}. Allowed: PDF, DOC, DOCX",
        )

    # Generate unique filename
    file_id = str(uuid.uuid4())
    safe_filename = f"{file_id}{ext}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)

    # Save file to disk
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    try:
        content = await file.read()
        async with aiofiles.open(file_path, "wb") as f:
            await f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # Parse directly (no microservice hop)
    try:
        result = extract_resume_data(file_path, ext)
        raw_text = result.get("_raw_text", "")
        clean_parsed = {k: v for k, v in result.items() if k != "_raw_text"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resume parsing failed: {str(e)}")

    # Store in PostgreSQL
    candidate = Candidate(
        raw_resume_path=file_path,
        parsed_data=clean_parsed,
    )
    session.add(candidate)
    await session.commit()
    await session.refresh(candidate)

    candidate_id = str(candidate.id)

    # Store embedding in ChromaDB (non-critical)
    try:
        metadata = {
            "name": clean_parsed.get("personal", {}).get("name", ""),
            "email": clean_parsed.get("personal", {}).get("email", ""),
            "skills": ", ".join(clean_parsed.get("skills", {}).get("technical", [])),
        }
        store_resume_embedding(candidate_id, raw_text, metadata)
    except Exception:
        pass

    return {
        "success": True,
        "candidate_id": candidate_id,
        "parsed_data": clean_parsed,
    }


@router.get("/{candidate_id}")
async def get_candidate(
    candidate_id: str,
    session: AsyncSession = Depends(get_session),
):
    """Fetch parsed candidate data by ID."""
    try:
        uid = uuid.UUID(candidate_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid candidate ID format")

    result = await session.execute(select(Candidate).where(Candidate.id == uid))
    candidate = result.scalar_one_or_none()

    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    return {
        "success": True,
        "candidate_id": str(candidate.id),
        "parsed_data": candidate.parsed_data,
        "created_at": candidate.created_at.isoformat(),
        "onboarding_complete": candidate.onboarding_complete,
    }


@router.post("/search")
async def search_candidates(query: str, top_k: int = 5):
    """
    Semantic search for similar candidates via ChromaDB.
    """
    if not query or not query.strip():
        raise HTTPException(status_code=400, detail="Search query is required")

    results = search_similar_candidates(query, top_k=top_k)
    return {"success": True, "results": results, "count": len(results)}
