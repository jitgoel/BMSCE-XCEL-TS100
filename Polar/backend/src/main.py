"""Minimal FastAPI backend for resume + JD analysis.

This app exposes a simple endpoint that accepts:
  - a resume file (PDF/DOCX)
  - a job description text

It extracts key skills from the JD using the LLM and returns them as JSON.
"""

import os
import tempfile
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from Analysis_part import ResumeAnalysisPipeline
from extract_info import JobDescriptionSkillExtractor

app = FastAPI(title="Resume Skill Extractor")

# Allow frontend to call API from another origin (e.g., React dev server)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _extract_resume_text(resume_path: Path) -> str:
    """Simple text extraction for PDF/DOCX (used for returning JSON)."""
    import pdfplumber
    from docx import Document

    ext = resume_path.suffix.lower()
    if ext == ".pdf":
        text = []
        with pdfplumber.open(resume_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text.append(page_text)
        return "\n".join(text)

    if ext in {".docx", ".doc"}:
        doc = Document(resume_path)
        return "\n".join([p.text for p in doc.paragraphs if p.text.strip()])

    return ""


@app.post("/extract-skills")
async def extract_skills(
    resume: UploadFile = File(...),
    jd_text: str = Form(...),
):
    """Extract skills and return full resume analysis JSON."""

    if resume.content_type not in {
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }:
        return JSONResponse(
            status_code=400,
            content={"error": "Resume must be PDF or DOCX."},
        )

    # Save the resume temporarily (for parsing + analysis)
    temp_dir = tempfile.mkdtemp(prefix="resume_extract_")
    resume_path = Path(temp_dir) / resume.filename

    with open(resume_path, "wb") as f:
        f.write(await resume.read())

    api_key = os.getenv("GROQ_API_KEY")
    print(api_key)
    if not api_key:
        return JSONResponse(
            status_code=500,
            content={"error": "GROQ_API_KEY environment variable is not set."},
        )

    # 1) Extract skills from JD using an LLM
    extractor = JobDescriptionSkillExtractor(groq_api_key=api_key)
    skills = extractor.extract(jd_text)

    # 2) Run the full resume analysis pipeline (includes ATS, project review, improvements, etc.)
    key_skills = skills.get("key_skills", [])
    analysis_pipeline = ResumeAnalysisPipeline(groq_api_key=api_key)
    analysis = await analysis_pipeline.run(
        resume_path=str(resume_path),
        jd_text=jd_text,
        key_skills=key_skills,
    )

    # 3) Return combined JSON (resume analysis + skill extraction + raw resume text)
    return {
        "resume_filename": resume.filename,
        "resume_text": _extract_resume_text(resume_path),
        "skills": skills,
        "analysis": analysis,
    }



   
