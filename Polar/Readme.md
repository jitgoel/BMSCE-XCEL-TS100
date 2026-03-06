# 🚀 AI Resume Analyzer

**Bridge the gap between raw talent and ATS algorithms.** The AI Resume Analyzer is a sophisticated pipeline that evaluates resumes against job descriptions (JD) using Large Language Models. It doesn't just "read" text; it performs structured extraction, identifies skill gaps, and provides actionable, quantified feedback to help candidates land interviews.

---

## 🌟 Key Features

* **🔍 LLM-Powered Structured Extraction:** Converts unstructured PDF/DOCX data into clean, queryable JSON.
* **⚖️ Skill Gap Analysis:** Automated comparison between candidate skills and JD requirements.
* **📊 ATS Compatibility Scoring:** Evaluates resumes based on formatting, keyword density, and section headers.
* **💡 Intelligent Rewriting:** Uses AI to transform weak bullet points into high-impact, quantified achievements.
* **📄 Professional PDF Reports:** Generates a downloadable summary of the analysis for offline review.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| **Frontend** | React.js | Interactive dashboard & file upload |
| **Backend** | FastAPI | High-performance asynchronous API |
| **AI Engine** | OpenAI / Gemini API | LLM-based extraction & suggestions |
| **Parsing** | pdfplumber / python-docx | Raw text extraction from documents |
| **Report Gen** | ReportLab | Programmatic PDF generation |

---

## 🏗️ System Architecture

The system follows a linear, high-throughput pipeline designed for low latency and clear data separation:

1. **Ingestion:** User uploads a document (PDF/DOCX) and pastes a Job Description.
2. **Extraction:** `pdfplumber` extracts raw text; the LLM parses this into a structured schema (Skills, Experience, Projects).
3. **Analysis Engine:**
* **Matching:** Calculates match percentage using:

$$\text{Match Score} = \left( \frac{\text{Matched Skills}}{\text{Total Required Skills}} \right) \times 100$$


* **ATS Audit:** Checks for headers, contact info, and "parsability."


4. **Optimization:** The LLM generates "Before/After" bullet points for resume sections.
5. **Delivery:** Results are streamed to a React dashboard and optionally bundled into a PDF.

---

## 📈 Analysis Logic

### Skill Gap Analysis

The engine identifies "Hard Skills" and "Soft Skills" missing from the resume.

* **Input:** `Python, Docker, SQL`
* **JD Requirement:** `Python, Docker, AWS, ML`
* **Result:** ⚠️ **Missing:** `AWS, Machine Learning`

### ATS Compatibility

The system flags common "ATS Killers" such as:

* Complex multi-column layouts.
* Images/Icons replacing text.
* Missing "Quantified Impact" (e.g., using "Worked on X" instead of "Increased X by 20%").

---

## 🚀 Getting Started

### Prerequisites

* Python 3.9+
* Node.js & npm
* API Key (OpenAI or Google Gemini)

### Installation

1. **Clone the repo:**
```bash
git clone https://github.com/your-username/ai-resume-analyzer.git
cd ai-resume-analyzer

```


2. **Setup Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

```


3. **Setup Frontend:**
```bash
cd frontend
npm install
npm start

```



---

## 🗺️ Roadmap

* [ ] **Semantic Matching:** Use Vector Embeddings (ChromaDB) for context-aware skill matching.
* [ ] **GitHub Integration:** Automatically fetch and evaluate project complexity via GitHub API.
* [ ] **Learning Path:** Suggest specific Udemy/Coursera courses for identified skill gaps.
* [ ] **Multi-Candidate Ranking:** Allow recruiters to upload a folder of resumes to find the best fit.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

### 📝 License

Distributed under the MIT License. See `LICENSE` for more information.