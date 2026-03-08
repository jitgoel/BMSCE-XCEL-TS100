# AI Resume Intelligence Platform

A production-ready SaaS application for analyzing resumes against job descriptions, powered by LangChain, OpenAI, and ChromaDB.

## Architecture

- **Frontend:** Pure HTML/CSS/JS (Vanilla) for high-performance and premium UI.
- **Backend:** Flask (Python) following microservice-like structure.
- **Database:** SQLite (SQLAlchemy) for relational data, ChromaDB for vector storage.
- **AI Core:** OpenAI + LangChain for intelligent chunking, parsing, generating cover letters, and optimizing bullets.

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key
   SECRET_KEY=your_flask_secret_key
   ```

3. **Run Backend:**
   ```bash
   cd backend
   flask run
   ```

4. **Run Frontend:**
   ```bash
   cd frontend
   python -m http.server 8000
   ```
   Open `http://localhost:8000` in your browser.
