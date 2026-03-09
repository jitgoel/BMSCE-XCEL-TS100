"""
Pixelmind NLP Microservice
Decoupled resume parsing service on port 8001.
Accepts PDF/DOCX uploads, extracts structured data using spaCy + custom rules.
"""

import os
import tempfile
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import aiofiles
from dotenv import load_dotenv

from extractor import extract_resume_data

load_dotenv()

app = FastAPI(
    title="Pixelmind NLP Service",
    description="Resume parsing microservice using spaCy + custom rules",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx"}


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "nlp-service"}


@app.post("/parse")
async def parse_resume(file: UploadFile = File(...)):
    """
    Parse an uploaded resume file and return structured JSON.
    Accepts PDF, DOC, DOCX files.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {ext}. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # Save to temp file for processing
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        # Extract structured data
        result = extract_resume_data(tmp_path, ext)
        return {"success": True, "data": result, "raw_text": result.get("_raw_text", "")}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Parsing failed: {str(e)}")
    finally:
        # Cleanup temp file
        if "tmp_path" in locals() and os.path.exists(tmp_path):
            os.unlink(tmp_path)


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8001))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=True)
