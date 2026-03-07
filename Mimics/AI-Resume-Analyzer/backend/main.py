from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os

from resume_parser import parse_resume
from ai_analyzer import analyze_resume
from trend_analyzer import analyze_market

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.post("/analyze")
async def analyze_resume_api(file: UploadFile = File(...)):

    file_path = f"{UPLOAD_FOLDER}/{file.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    parsed_data = parse_resume(file_path)

    ai_result = analyze_resume(parsed_data)

    market = analyze_market(parsed_data["skills"])

    return {
        "parsed_resume": parsed_data,
        "ai_analysis": ai_result,
        "market_trends": market
    }

@app.get("/")
def home():
    return {"message": "AI Resume Analyzer API is running"}