# PixelMinds 🧠
**XCEL Hackathon Project**

PixelMinds is an AI-powered, end-to-end technical recruitment and onboarding platform built to streamline the candidate evaluation process. Leveraging multiple language models, decoupled microservices, and graph relationships, it autonomously handles resume parsing, tailored candidate questioning, multi-stage interactive interviews, and comprehensive analytical reporting.

---

## 🏗️ Architecture Overview

The system is constructed with a modern, microservice-inspired architecture using Next.js for the interface and FastAPI for specialized backend services:

### 1. Frontend (`/frontend`)
- **Tech Stack**: Next.js 16, React 19, TypeScript, Tailwind CSS v4.
- **Description**: Provides the responsive graphical user interface for candidates to upload their resumes and participate in interactive, real-time onboarding and technical/HR interview sessions. 

### 2. Backend Orchestrator (`/backend`)
- **Tech Stack**: FastAPI, SQLAlchemy (asyncio), PostgreSQL, Neo4j, ChromaDB, Sentence-Transformers.
- **Description**: The core orchestrator running on Port 8000. It manages state for onboarding and interview sessions, orchestrates interactions with the LLM (DeepSeek), handles document storage with ChromaDB for vector-based search, and utilizes Neo4j for mapping candidate traits.
- **Key Features**:
  - `routes/resume`: Entrypoint for candidate creation and resume parsing handoff. 
  - `routes/onboarding`: Specialized intake based on parsed resume constraints.
  - `interview`: Multi-stage, LLM-driven interactive chat handler evaluating HR and technical capacity dynamically.

### 3. NLP Microservice (`/nlp-service`)
- **Tech Stack**: FastAPI, spaCy, Python.
- **Description**: A decoupled natural language processing service running on Port 8001. Utilizing custom extraction rules, it rapidly converts uploaded raw documents (PDF, DOC, DOCX) into clean, structured JSON candidate schemas.

---

## 🗄️ Database & Storage

The platform employs a polyglot persistence strategy:

1. **PostgreSQL**: Central relational database (see `schema.sql`). 
   - `candidates`: Raw resumes overviews and structured parsed JSON.
   - `onboarding_answers`: Recorded answers and mapping.
   - `candidate_traits`: Calculated psychological and technical trait scores.
   - `interview_sessions`: Chat history arrays, AI state tracking, and final evaluation reports.
2. **ChromaDB**: Utilized via `vectorstore.py` for RAG integrations, embedding unstructured text artifacts globally.
3. **Neo4j**: Capturing candidate-skill correlation graphs (`neo4j_client.py`).

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18+
- **Python**: 3.10+
- **PostgreSQL**: Pre-configured database (see `schema.sql`)
- **Neo4j**: Graph DB instance available
- **LLM Keys**: DeepSeek or equivalent API token.

### 1. Launch the Backend
```bash
cd backend
python -m venv venv
source venv/Scripts/activate  # Windows
pip install -r requirements.txt
uvicorn main:app --port 8000 --reload
```

### 2. Launch the NLP Engine
```bash
cd nlp-service
python -m venv venv
source venv/Scripts/activate  # Windows
pip install -r requirements.txt
uvicorn main:app --port 8001 --reload
```

### 3. Launch the Next.js Frontend
```bash
cd frontend
npm install
npm run dev
```

The services will successfully coordinate. Open your browser to [http://localhost:3000](http://localhost:3000) to begin the PixelMinds process!
