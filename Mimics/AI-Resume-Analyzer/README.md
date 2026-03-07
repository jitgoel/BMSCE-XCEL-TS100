---

# 🤖 AI Resume Analyzer

An **AI-powered Resume Analyzer** that evaluates resumes using **Google Gemini LLM**, extracts key skills, analyzes job-market demand, and provides intelligent suggestions to improve resume quality.

This project combines a **React frontend**, **FastAPI backend**, and **Gemini AI** to create an intelligent resume feedback system.

---

# 🚀 Features

* 📄 Upload Resume (**PDF / DOCX**)
* 🔎 Extract key information (skills, education, experience)
* 🤖 **AI-powered resume analysis**
* 📊 **Skill gap analysis** based on current market demand
* 📈 Visual **skill analytics dashboard**
* 💡 Intelligent **resume improvement suggestions**
* ⚡ **REST API architecture**

---

# 🏗 Project Architecture

```
User
 │
 ▼
React Frontend
 │
 │ REST API
 ▼
FastAPI Backend
 │
 ├── Resume Parser
 ├── AI Analyzer
 └── Market Trend Analyzer
 │
 ▼
Google Gemini API
 │
 ▼
Analysis Results
```

---

# 📂 Project Structure

```
ai-resume-analyzer
│
├── frontend
│   ├── src
│   │   ├── components
│   │   │   ├── ResumeUpload.jsx
│   │   │   ├── AnalysisResult.jsx
│   │   │   └── SkillChart.jsx
│   │   │
│   │   ├── pages
│   │   │   └── Home.jsx
│   │   │
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   └── package.json
│
├── backend
│   ├── main.py
│   ├── resume_parser.py
│   ├── ai_analyzer.py
│   ├── trend_analyzer.py
│   └── requirements.txt
│
└── README.md
```

---

# 🛠 Tech Stack

## Frontend

* **React**
* **Vite**
* **JavaScript**
* **HTML / CSS**
* **Chart.js / Recharts**

## Backend

* **FastAPI**
* **Python**
* **Uvicorn**

## AI / NLP

* **Google Gemini API**
* **spaCy**
* **PyPDF / pdfplumber**

## Development Tools

* **Node.js**
* **npm**
* **VS Code**
* **Git**

---

# ⚙️ Installation Guide

## 1️⃣ Clone Repository

```bash
git clone https://github.com/your-username/ai-resume-analyzer.git
cd ai-resume-analyzer
```

---

# 🖥 Backend Setup

Navigate to backend:

```bash
cd backend
```

Create virtual environment:

```bash
python -m venv venv
```

Activate environment

### Windows

```bash
venv\Scripts\activate
```

### Mac / Linux

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

---

# 🔑 Setup Gemini API Key

Create a **`.env`** file inside the backend folder:

```
GEMINI_API_KEY=your_api_key_here
```

---

# ▶ Run Backend Server

```bash
uvicorn main:app --reload
```

Backend runs at:

```
http://127.0.0.1:8000
```

API Documentation:

```
http://127.0.0.1:8000/docs
```

---

# 💻 Frontend Setup

Navigate to frontend:

```bash
cd ../frontend
```

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Frontend runs at:

```
http://localhost:5173
```

---

# 📡 API Endpoint

## Analyze Resume

**POST /analyze**

Upload a resume file to receive AI analysis.

### Example Response

```json
{
  "parsed_resume": {
    "name": "John Doe",
    "skills": ["Python", "React", "Machine Learning"]
  },
  "ai_analysis": "Your resume is strong but lacks cloud skills.",
  "market_trends": {
    "missing_skills": ["Docker", "Kubernetes"]
  }
}
```

---

# 📊 Example Workflow

1️⃣ User uploads resume
2️⃣ Frontend sends file to backend
3️⃣ Backend parses resume text
4️⃣ Gemini AI analyzes resume content
5️⃣ Market analyzer checks skill demand
6️⃣ Backend sends results to frontend
7️⃣ User views insights, charts, and suggestions

---

# 📈 Future Improvements

* ATS compatibility scoring
* AI-powered resume rewriting
* Job recommendation system
* LinkedIn profile analysis
* Multi-language resume support
* Cloud deployment (**AWS / GCP**)

---

# 👨‍💻 Author

**Team Mimics**
> D M Abdul Razzaq
> Sayampadmanavar
> Shashank R
Department of Artificial Intelligence & Machine Learning
**BMS College of Engineering**

---

# 🤝 Contributions

Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a Pull Request

---
