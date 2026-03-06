"""Utility to extract key skills from a Job Description using an LLM.

This module is intentionally small and focused: it takes JD text as input and
returns a structured list of key technical skills, soft skills, and tools.

Usage (CLI):
  python extract_info.py --jd "<paste job description>"
  python extract_info.py --jd-file ./job_description.txt

Environment:
  - Set GROQ_API_KEY for Groq API access.
  - Optionally set GROQ_MODEL to choose a model (default: llama3-mini).
"""

import argparse
import json
import os
from typing import Optional
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate

load_dotenv()

class JobDescriptionSkillExtractor:
    """Extracts important skills from a job description using a Groq LLM."""

    def __init__(
        self,
        groq_api_key: Optional[str] = None,
        model: Optional[str] = 'openai/gpt-oss-120b',
        temperature: float = 0.3,
    ):
        groq_api_key = os.getenv("GROQ_API_KEY")
        if not groq_api_key:
            raise ValueError("GROQ_API_KEY must be provided via env or constructor.")

        model = model 

        self.llm = ChatGroq(
            groq_api_key=groq_api_key,
            model_name=model,
            temperature=temperature,
        )

        self.parser = JsonOutputParser()

        self.prompt = ChatPromptTemplate.from_template(
            """
You are an assistant that extracts the most important skills from a job description.

JOB DESCRIPTION:
{jd_text}

Return ONLY valid JSON with:
{{
  "key_skills": ["<skill>"],
  "soft_skills": ["<skill>"],
  "tools": ["<tool>"],
  "notes": "<short note on how skills were extracted>"
}}
""")
    

    def extract(self, jd_text: str) -> dict:
        """Return a dict with key_skills, soft_skills, tools, and notes."""
        runnable = self.prompt | self.llm | self.parser
        # RunnableSequence isn't directly callable; use invoke to execute.
        return runnable.invoke({"jd_text": jd_text})


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Extract key skills from a job description using a Groq LLM."
    )
    parser.add_argument("--jd", type=str, help="Job description text.")
    parser.add_argument("--jd-file", type=str, help="Path to a job description file.")
    parser.add_argument(
        "--api-key",
        type=str,
        default=os.getenv("GROQ_API_KEY"),
        help="Groq API key (can also be provided via GROQ_API_KEY env var).",
    )
    parser.add_argument(
        "--model",
        type=str,
        default=os.getenv("GROQ_MODEL"),
        help="Optional Groq model name (e.g. llama3-mini).",
    )
    parser.add_argument(
        "--temperature",
        type=float,
        default=0.3,
        help="LLM temperature (0.0-1.0).",
    )

    args = parser.parse_args()

    if not args.jd and not args.jd_file:
        parser.error("Please provide either --jd or --jd-file.")

    if not args.api_key:
        parser.error("Groq API key is required (set GROQ_API_KEY or use --api-key).")

    if args.jd_file:
        with open(args.jd_file, "r", encoding="utf-8") as f:
            jd_text = f.read().strip()
    else:
        jd_text = args.jd.strip()

    extractor = JobDescriptionSkillExtractor(
        groq_api_key=args.api_key,
        model=args.model,
        temperature=args.temperature,
    )

    try:
        skills = extractor.extract(jd_text)
    except Exception as e:
        raise SystemExit(f"Error extracting skills: {e}")

    print(json.dumps(skills, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()

