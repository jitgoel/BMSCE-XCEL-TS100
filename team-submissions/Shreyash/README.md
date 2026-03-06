
# AI Resume Analyzer

An **AI-driven resume evaluation and career insights dashboard** built with **Python and Streamlit**.  
The system analyzes resumes, evaluates **ATS compatibility**, identifies **skill gaps**, and compares **multiple resumes against industry benchmarks**.

It provides automated resume insights similar to an **Applicant Tracking System (ATS)** used by recruiters.

---

# Features

## ATS Resume Scoring

Evaluates resumes based on multiple factors including:

- **Skill Match Score**
- **Project Quality**
- **Experience Relevance**
- **Resume Structure**
- **Skill Density**
- **Achievement Impact**
- **Bullet Point Strength**

Generates an **overall ATS compatibility score (0–100).**

---

## Skill Extraction using NLP

Uses **spaCy NLP** to extract technical skills from resumes and compare them against role requirements.

Detected skills are matched with a **curated technical skill database**.

---

## Skill Gap Analysis

Identifies missing skills required for a specific role and provides recommendations for improvement.

Example output:

```
Matched Skills: 5 / 9

Recommended Skills:
• Machine Learning
• Scikit-learn
• Data Visualization
• Statistics
```

---

## Industry Benchmark Comparison

Compares the resume against **typical industry benchmarks** across multiple dimensions.

Visualized using a **vertical comparison bar chart**.

Metrics include:

- **Skills**
- **Projects**
- **Experience**
- **Structure**
- **Technical Density**
- **Impact**
- **Bullet Quality**

---

## Multi-Resume Comparison

Upload multiple resumes simultaneously and compare them.

The dashboard automatically:

- Calculates **ATS score** for each resume
- Displays a **comparison chart**
- Highlights the **best resume**

Example:

```
Resume Comparison

resume_v1.pdf     68
resume_v2.pdf     74
resume_final.pdf  81

🏆 Best Resume: resume_final.pdf
```

---

## Resume Inspector

Select any uploaded resume to view **detailed analysis** including:

- **Skill coverage**
- **Skill gaps**
- **Career recommendations**
- **Resume quality metrics**
- **Resume statistics**
- **Improvement suggestions**

---

## Career Recommendations

Based on detected skills, the system suggests **relevant career paths**.

Example:

```
Recommended Roles:
• Data Scientist
• Machine Learning Engineer
• Backend Developer
• AI Engineer
```

---

## Resume Structure Detection

Detects key resume sections automatically:

- ✓ **Skills**
- ✓ **Projects**
- ✓ **Experience**
- ✓ **Education**
- ✓ **Summary**

---

## Resume Quality Metrics

Evaluates resume writing quality using **heuristic AI analysis**.

Metrics include:

- **quantified achievements**
- **strong bullet points**
- **technical depth**
- **structural completeness**

---

# System Architecture

```
project/
│
├── frontend/
│   └── dashboard.py
│
├── utils/
│   ├── parser.py
│   ├── analyzer.py
│   ├── scorer.py
│   ├── suggestions.py
│   ├── resume_quality.py
│   ├── bullet_analyzer.py
│   ├── section_classifier.py
│   ├── impact_analyzer.py
│   ├── skill_gap.py
│   └── job_recommender.py
│
├── data/
│   └── skills.json
│
├── app.py
│
└── README.md
```

---

# Technologies Used

| Technology | Purpose |
|-----------|--------|
| Python | Core programming language |
| Streamlit | Interactive dashboard UI |
| spaCy | NLP skill extraction |
| Matplotlib | Data visualizations |
| PyPDF | Resume text extraction |
| NumPy | Numerical processing |

---

# Installation

Clone the repository, then:

```
cd ai-resume-analyzer
```

Install dependencies:

```
pip install -r requirements.txt
```

Install spaCy model:

```
python -m spacy download en_core_web_sm
```

---

# Running the Application

Start the Streamlit server:

```
streamlit run app.py
```

Open in browser:

```
http://localhost:8501
```

---

# Example Workflow

1. Upload **one or more resumes**
2. Enter a **target job role**
3. Run **analysis**
4. View **ATS score and insights**
5. Compare **multiple resumes**
6. Inspect **detailed analytics**

---

# Example Output

The dashboard generates:

- **ATS score progress bar**
- **Resume vs industry comparison chart**
- **Skill coverage analysis**
- **Skill gap insights**
- **Career recommendations**
- **Resume quality metrics**
- **Resume improvement suggestions**

---

# Future Improvements

Possible enhancements:

- **transformer-based skill extraction**
- **LLM powered resume rewriting**
- **job description parsing**
- **recruiter mode for candidate ranking**
- **resume optimization suggestions**
- **cloud deployment**
