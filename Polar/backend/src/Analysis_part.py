# resume_pipeline.py
# ─────────────────────────────────────────────────────────────────────────────
# Full Resume Analysis Pipeline — Single Class, Parallel LLM Chains
# Uses: LangChain + OpenAI (ChatGPT) + asyncio for parallel execution
#
# Install:
#   pip install langchain langchain-openai langchain-core pdfplumber python-docx asyncio
#
# Usage:
#   pipeline = ResumeAnalysisPipeline(openai_api_key="sk-...")
#   result   = asyncio.run(pipeline.run(resume_path="resume.pdf", jd_text="...", key_skills=["Python","AWS"]))
# ─────────────────────────────────────────────────────────────────────────────
import os
import re
import json
import asyncio
from dotenv import load_dotenv
import pdfplumber
load_dotenv()

from docx import Document
from typing import Optional

from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.runnables import RunnableParallel, RunnableLambda

class ResumeAnalysisPipeline:
    """
    Single-class pipeline that:
      1. Extracts raw text from PDF or DOCX
      2. Runs 5 LLM chains IN PARALLEL:
         - ATS Score
         - Skill Gap Analysis  (also does manual keyword check)
         - Project Rating & Improvements
         - Overall Improvements wrt JD
         - Next Domain Targets
      3. Runs 1 final sequential LLM chain:
         - Improved Resume (uses all above results as context)
      4. Returns one unified JSON result
    """

# ──────────────────────────────────────────────────────────────────────────
# INIT
# ──────────────────────────────────────────────────────────────────────────

    def __init__(
        self,
        groq_api_key: Optional[str] = None,
        # NOTE: Groq models are gated; if this errors, try a smaller publicly-available model like "llama3-8b".
        model: Optional[str] = "openai/gpt-oss-120b",
        temperature: float = 0.3,
    ):
        groq_api_key = groq_api_key or os.getenv("GROQ_API_KEY")
        if not groq_api_key:
            raise ValueError("GROQ_API_KEY must be provided via env or constructor.")

        model = model 

        self.llm = ChatGroq(
            groq_api_key=groq_api_key,
            model_name=model,
            temperature=temperature,
        )

        self.parser = JsonOutputParser()

    # ──────────────────────────────────────────────────────────────────────────
    # TEXT EXTRACTION
    # ──────────────────────────────────────────────────────────────────────────

    def _extract_text(self, resume_path: str) -> str:
        """Extract raw text from PDF or DOCX."""
        ext = os.path.splitext(resume_path)[-1].lower()

        if ext == ".pdf":
            text = []
            with pdfplumber.open(resume_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text.append(page_text)
            return "\n".join(text)

        elif ext in (".docx", ".doc"):
            doc  = Document(resume_path)
            return "\n".join([para.text for para in doc.paragraphs if para.text.strip()])

        else:
            raise ValueError(f"Unsupported file type: {ext}. Use PDF or DOCX.")

    # ──────────────────────────────────────────────────────────────────────────
    # MANUAL SKILL GAP (no LLM — pure string match)
    # ──────────────────────────────────────────────────────────────────────────

    def _manual_skill_check(self, resume_text: str, key_skills: list[str]) -> dict:
        """
        Manually checks which key skills from the JD appear in the resume.
        Case-insensitive substring match. No LLM needed.
        """
        resume_lower = resume_text.lower()
        matched, missing = [], []

        for skill in key_skills:
            if skill.lower() in resume_lower:
                matched.append(skill)
            else:
                missing.append(skill)

        match_pct = round((len(matched) / len(key_skills)) * 100, 1) if key_skills else 0

        return {
            "manual_matched_skills": matched,
            "manual_missing_skills": missing,
            "manual_match_percentage": match_pct,
        }

    # ──────────────────────────────────────────────────────────────────────────
    # CHAIN BUILDERS
    # ──────────────────────────────────────────────────────────────────────────

    def _build_ats_chain(self):
        prompt = ChatPromptTemplate.from_template("""
You are an expert ATS (Applicant Tracking System) evaluator.

Analyze the resume below against the job description and return ONLY valid JSON.

RESUME:
{resume_text}

JOB DESCRIPTION:
{jd_text}

Return this exact JSON structure:
{{
  "ats_overall_score": <integer 0-100>,
  "breakdown": {{
    "keyword_match": <integer 0-100>,
    "section_headers": <integer 0-100>,
    "contact_info": <integer 0-100>,
    "formatting": <integer 0-100>,
    "quantified_impact": <integer 0-100>,
    "action_verbs": <integer 0-100>,
    "readability": <integer 0-100>
  }},
  "ats_killers": [
    {{"issue": "<issue>", "severity": "high|medium|low", "fix": "<fix>"}}
  ],
  "keyword_density_analysis": {{
    "high_frequency_jd_keywords": ["<keyword>"],
    "found_in_resume": ["<keyword>"],
    "missing_from_resume": ["<keyword>"]
  }}
}}
""")
        return prompt | self.llm | self.parser

    def _build_skill_gap_chain(self):
        prompt = ChatPromptTemplate.from_template("""
You are a senior technical recruiter performing a skill gap analysis.

RESUME:
{resume_text}

JOB DESCRIPTION:
{jd_text}

KEY SKILLS FROM JD (manually extracted):
{key_skills}

Return ONLY valid JSON:
{{
  "hard_skills": {{
    "matched": ["<skill>"],
    "missing": ["<skill>"],
    "partial": [{{"skill": "<skill>", "note": "<what they have vs what's needed>"}}]
  }},
  "soft_skills": {{
    "matched": ["<skill>"],
    "missing": ["<skill>"]
  }},
  "experience_gap": {{
    "required_years": <number or null>,
    "candidate_years": <number or null>,
    "gap_note": "<note>"
  }},
  "education_fit": {{
    "required": "<requirement>",
    "candidate": "<what they have>",
    "fit": "strong|moderate|weak"
  }},
  "overall_skill_fit": "strong|moderate|weak",
  "priority_skills_to_add": ["<skill — most impactful to learn first>"]
}}
""")
        return prompt | self.llm | self.parser

    def _build_project_rating_chain(self):
        prompt = ChatPromptTemplate.from_template("""
You are a senior engineer evaluating resume projects against a job description.

RESUME:
{resume_text}

JOB DESCRIPTION:
{jd_text}

Identify every project mentioned in the resume. Rate each one and suggest improvements.

Return ONLY valid JSON:
{{
  "projects": [
    {{
      "name": "<project name>",
      "current_description": "<what the resume says>",
      "relevance_to_jd": "high|medium|low",
      "rating": <integer 1-10>,
      "rating_reason": "<why this rating>",
      "low_rating_reason": "<if rating is low, why; else leave empty>",
      "jd_alignment": "<how this project maps to JD requirements or where it falls short>",
      "strengths": ["<strength>"],
      "weaknesses": ["<weakness>"],
      "improvement_tips": ["<specific improvements to boost impact or relevance>"],
      "improved_description": "<rewritten project bullet points with quantified impact, action verbs, and JD-relevant keywords>",
      "suggested_tech_to_highlight": ["<tech>"]
    }}
  ],
  "overall_projects_score": <integer 1-10>,
  "projects_summary": "<2-3 sentence overall assessment>"
}}
""")
        return prompt | self.llm | self.parser

    def _build_improvements_chain(self):
        prompt = ChatPromptTemplate.from_template("""
You are a professional resume coach. Provide comprehensive resume improvements tailored to this specific JD.

RESUME:
{resume_text}

JOB DESCRIPTION:
{jd_text}

Return ONLY valid JSON:
{{
  "summary_section": {{
    "current": "<current summary or 'missing'>",
    "improved": "<rewritten summary targeting the JD in 3-4 lines>"
  }},
  "experience_bullets": [
    {{
      "original": "<original bullet>",
      "improved": "<improved bullet with action verb + metric + impact>"
    }}
  ],
  "sections_to_add": ["<section name and what to put in it>"],
  "sections_to_remove_or_trim": ["<section and reason>"],
  "formatting_fixes": ["<specific formatting improvement>"],
  "keyword_injections": [
    {{
      "keyword": "<JD keyword>",
      "where_to_add": "<which section/bullet>"
    }}
  ],
  "improvement_tips": ["<actionable tip to improve the resume relative to this JD>"],
  "jd_alignment_notes": "<how well the resume aligns with the JD and what to prioritize>",
  "overall_improvement_score_delta": "<e.g. +18 ATS points expected>"
}}
""")
        return prompt | self.llm | self.parser

    def _build_next_domain_chain(self):
        prompt = ChatPromptTemplate.from_template("""
You are a career strategist. Based on this resume and current JD, suggest next career domains and roles.

RESUME:
{resume_text}

CURRENT JD BEING APPLIED TO:
{jd_text}

Return ONLY valid JSON:
{{
  "current_profile_summary": "<2-3 sentence summary of candidate's current positioning>",
  "next_domains": [
    {{
      "domain": "<domain name>",
      "fit_score": <integer 1-10>,
      "reasoning": "<why this domain suits them>",
      "jd_relevance": "<how this domain connects to the current JD>",
      "skill_gap_to_enter": ["<skill to learn>"],
      "example_roles": ["<role title>"],
      "estimated_transition_time": "<e.g. 3-6 months with X, Y>",
      "transition_tips": ["<concrete next steps to move into this domain>"]
    }}
  ],
  "recommended_certifications": [
    {{
      "name": "<cert name>",
      "provider": "<Coursera/AWS/Google etc>",
      "relevance": "<why useful>"
    }}
  ],
  "long_term_career_path": "<2-3 sentence narrative of ideal 3-5 year trajectory>"
}}
""")
        return prompt | self.llm | self.parser

    def _build_final_resume_chain(self):
        prompt = ChatPromptTemplate.from_template("""
You are an expert resume writer. Using the original resume AND all analysis results below,
produce a complete rewritten resume optimized for the job description.

ORIGINAL RESUME:
{resume_text}

JOB DESCRIPTION:
{jd_text}

ANALYSIS CONTEXT:
- ATS Issues: {ats_killers}
- Missing Skills: {missing_skills}
- Project Improvements: {project_improvements}
- Suggested Improvements: {improvements}

Rules:
- Keep it to 1 page worth of content (unless senior, max 2)
- Use strong action verbs for every bullet
- Quantify every achievement possible (use estimates if needed, mark with ~)
- Inject missing JD keywords naturally
- Fix all ATS issues identified
- Rewrite projects with improved descriptions
- Add a strong Summary section targeting this specific JD

Return ONLY valid JSON:
{{
  "final_resume": {{
    "name": "<name>",
    "contact": {{
      "email": "<email>",
      "phone": "<phone or 'not found'>",
      "linkedin": "<linkedin or 'not found'>",
      "github": "<github or 'not found'>",
      "location": "<location>"
    }},
    "summary": "<3-4 line professional summary targeting this JD>",
    "skills": {{
      "technical": ["<skill>"],
      "tools": ["<tool>"],
      "soft": ["<soft skill>"]
    }},
    "experience": [
      {{
        "title": "<job title>",
        "company": "<company>",
        "duration": "<duration>",
        "bullets": ["<improved bullet>"]
      }}
    ],
    "projects": [
      {{
        "name": "<project>",
        "tech_stack": ["<tech>"],
        "bullets": ["<improved bullet>"]
      }}
    ],
    "education": [
      {{
        "degree": "<degree>",
        "school": "<school>",
        "year": "<year>",
        "relevant_coursework": ["<course>"]
      }}
    ],
    "certifications": ["<cert if any>"],
    "resume_improvement_summary": "<what was changed and why>"
  }}
}}
""")
        return prompt | self.llm | self.parser

    # ──────────────────────────────────────────────────────────────────────────
    # MAIN RUN
    # ──────────────────────────────────────────────────────────────────────────
