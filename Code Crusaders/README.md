# 🔍 AI Code Review Assistant

An intelligent, AI-powered code review tool that analyzes source code for bugs, security vulnerabilities, performance issues, and style violations — and **teaches you the best way to fix them**.

Built with **Python**, **LangChain**, **Groq** (free tier), and **Streamlit**.

![Python](https://img.shields.io/badge/Python-3.9+-blue?logo=python)
![Streamlit](https://img.shields.io/badge/Streamlit-1.31+-red?logo=streamlit)
![LangChain](https://img.shields.io/badge/LangChain-0.1+-green?logo=chainlink)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI-Powered Review** | Uses Llama 3.3 70B / Mixtral via Groq (100% free) |
| 🐛 **Bug Detection** | Finds logical errors, edge cases, and runtime issues |
| 🔒 **Security Analysis** | Detects SQL injection, hardcoded secrets, eval() abuse, etc. |
| ⚡ **Performance Tips** | Identifies inefficiencies and suggests optimizations |
| 🎨 **Style Checks** | Ensures clean, readable, maintainable code |
| 📐 **Best Practices** | SOLID, DRY, error handling, and industry standards |
| ✅ **Learn & Fix** | Every issue includes corrected code + explanation + references |
| 📊 **Static Analysis** | Local metrics: complexity, LOC, function analysis (no AI needed) |
| 📄 **Report Export** | Download full Markdown review report |
| 💻 **15+ Languages** | Python, JavaScript, Java, C++, Go, Rust, and more |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Streamlit UI (app.py)                  │
│   Code Input → Review Trigger → Results Dashboard        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────┐    ┌──────────────────────────┐    │
│  │  Code Analyzer   │    │    Review Engine          │    │
│  │  (Static)        │    │    (LLM-powered)          │    │
│  │                  │    │                           │    │
│  │  • AST parsing   │    │  LangChain + Groq (Free) │    │
│  │  • Complexity    │    │  • Llama 3.3 70B          │    │
│  │  • Anti-patterns │    │  • Mixtral 8x7B           │    │
│  │  • Metrics       │    │  • Gemma 2 9B             │    │
│  └─────────────────┘    └──────────────────────────┘    │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  prompts.py (Templates)  │  utils.py (Helpers)          │
└──────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone <repository-url>
cd "Code Crusaders"
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Get a FREE Groq API key
1. Go to [console.groq.com](https://console.groq.com/keys)
2. Sign up (free) and create an API key
3. Copy the key (starts with `gsk_...`)

### 4. Run the application
```bash
streamlit run app.py
```

### 5. Use the app
1. Paste your Groq API key in the sidebar
2. Paste code, upload a file, or load a sample
3. Click **"🚀 Run AI Code Review"**
4. Explore issues, learn fixes, and download the report

---

## 📂 Project Structure

```
Code Crusaders/
├── app.py               # Streamlit UI (main entry point)
├── review_engine.py     # LangChain + Groq LLM pipeline
├── code_analyzer.py     # Static analysis (AST, regex)
├── prompts.py           # Structured LLM prompt templates
├── utils.py             # Language detection, JSON parsing, reports
├── requirements.txt     # Python dependencies
├── .env.example         # Environment variable template
├── README.md            # This file
└── samples/
    ├── sample_bad.py    # Intentionally flawed code for demo
    └── sample_good.py   # Clean code example for comparison
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| **Python 3.9+** | Core language |
| **Streamlit** | Web UI framework |
| **LangChain** | LLM orchestration |
| **Groq** | Free LLM inference (Llama / Mixtral) |
| **AST Module** | Python static analysis |

---

## 📋 Review Modes

1. **🔍 Comprehensive** — Full analysis covering bugs, security, performance, style, and best practices
2. **🔒 Security Focus** — Deep security audit with CWE IDs and attack vectors
3. **⚡ Quick Review** — Top 3-5 critical issues only (faster, fewer tokens)

---

## 👥 Team

**Code Crusaders** — BMSCE XCEL Hackathon 2026

---

## 📜 License

MIT License — Free to use, modify, and distribute.
