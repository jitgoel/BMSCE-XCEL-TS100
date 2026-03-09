"""
Pixelmind Main Backend
FastAPI server on port 8000 — handles resume uploads, candidate data, and onboarding.
"""

import os
import traceback
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from database import init_db
from routes.resume import router as resume_router
from routes.onboarding import router as onboarding_router
from neo4j_client import close_driver as close_neo4j

load_dotenv()

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database tables on startup, cleanup on shutdown."""
    try:
        await init_db()
        print("[backend] Database initialized successfully")
    except Exception as e:
        print(f"[backend] WARNING: Database init failed ({e}). API routes requiring DB will fail.")
    yield
    # Cleanup
    close_neo4j()


app = FastAPI(
    title="Pixelmind Backend",
    description="Main API server for Pixelmind Onboarding",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow all origins so frontend can always reach backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# Global exception handler — ensures CORS headers are on error responses too
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        },
    )


# Mount routes
app.include_router(resume_router, prefix="/api/resume", tags=["Resume"])
app.include_router(onboarding_router, prefix="/api/onboarding", tags=["Onboarding"])

from interview.router import router as interview_router
app.include_router(interview_router)


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "pixelmind-backend"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
