"""
Utility functions for the AI Code Review Assistant.
Handles language detection, JSON parsing, and report generation.
"""

import json
import re
from datetime import datetime


# ─── Language Detection ──────────────────────────────────────────────────────

EXTENSION_MAP = {
    ".py": "Python",
    ".js": "JavaScript",
    ".ts": "TypeScript",
    ".jsx": "JavaScript (React)",
    ".tsx": "TypeScript (React)",
    ".java": "Java",
    ".cpp": "C++",
    ".c": "C",
    ".cs": "C#",
    ".go": "Go",
    ".rs": "Rust",
    ".rb": "Ruby",
    ".php": "PHP",
    ".swift": "Swift",
    ".kt": "Kotlin",
    ".scala": "Scala",
    ".r": "R",
    ".sql": "SQL",
    ".html": "HTML",
    ".css": "CSS",
    ".sh": "Shell/Bash",
    ".yml": "YAML",
    ".yaml": "YAML",
    ".json": "JSON",
    ".xml": "XML",
    ".dart": "Dart",
    ".lua": "Lua",
    ".pl": "Perl",
}

SUPPORTED_LANGUAGES = [
    "Python", "JavaScript", "TypeScript", "Java", "C++", "C", "C#",
    "Go", "Rust", "Ruby", "PHP", "Swift", "Kotlin", "Scala", "R",
    "SQL", "HTML", "CSS", "Shell/Bash", "YAML", "Dart", "Lua", "Perl",
]


def detect_language(filename: str) -> str:
    """Detect programming language from file extension."""
    for ext, lang in EXTENSION_MAP.items():
        if filename.lower().endswith(ext):
            return lang
    return "Unknown"


# ─── JSON Parsing ────────────────────────────────────────────────────────────

def parse_llm_json(response_text: str) -> dict:
    """
    Parse JSON from LLM response with error recovery.
    Handles common LLM output issues like markdown fences, trailing commas, etc.
    """
    text = response_text.strip()

    # Remove markdown code fences
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*\n?", "", text)
        text = re.sub(r"\n?```\s*$", "", text)

    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try to extract JSON object from text
    json_match = re.search(r"\{.*\}", text, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group())
        except json.JSONDecodeError:
            pass

    # Remove trailing commas (common LLM mistake)
    cleaned = re.sub(r",\s*([}\]])", r"\1", text)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Return fallback structure
    return {
        "overall_score": 0,
        "summary": "Failed to parse AI response. Please try again.",
        "issues": [],
        "strengths": [],
        "metrics": {
            "readability": 0,
            "maintainability": 0,
            "security": 0,
            "performance": 0,
            "best_practices": 0,
        },
        "parse_error": True,
        "raw_response": response_text[:500],
    }


# ─── Severity Helpers ────────────────────────────────────────────────────────

SEVERITY_ORDER = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}
SEVERITY_EMOJI = {"Critical": "🔴", "High": "🟠", "Medium": "🟡", "Low": "🟢"}
SEVERITY_COLOR = {
    "Critical": "#ff4444",
    "High": "#ff8c00",
    "Medium": "#ffd700",
    "Low": "#44bb44",
}

CATEGORY_EMOJI = {
    "Bug": "🐛",
    "Security": "🔒",
    "Performance": "⚡",
    "Style": "🎨",
    "Best Practice": "📐",
}


def sort_issues_by_severity(issues: list) -> list:
    """Sort issues by severity (Critical first)."""
    return sorted(issues, key=lambda x: SEVERITY_ORDER.get(x.get("severity", "Low"), 3))


def count_by_severity(issues: list) -> dict:
    """Count issues by severity level."""
    counts = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
    for issue in issues:
        sev = issue.get("severity", "Low")
        if sev in counts:
            counts[sev] += 1
    return counts


def count_by_category(issues: list) -> dict:
    """Count issues by category."""
    counts = {}
    for issue in issues:
        cat = issue.get("category", "Other")
        counts[cat] = counts.get(cat, 0) + 1
    return counts


# ─── Report Generation ───────────────────────────────────────────────────────

def generate_markdown_report(review: dict, language: str, code: str) -> str:
    """Generate a downloadable Markdown report from the review results."""
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    score = review.get("overall_score", 0)
    summary = review.get("summary", "N/A")
    issues = review.get("issues", [])
    strengths = review.get("strengths", [])
    metrics = review.get("metrics", {})

    report = []
    report.append("# 🔍 AI Code Review Report")
    report.append(f"\n**Generated:** {now}")
    report.append(f"**Language:** {language}")
    report.append(f"**Overall Score:** {score}/100\n")
    report.append(f"## Summary\n\n{summary}\n")

    # Metrics
    if metrics:
        report.append("## Quality Metrics\n")
        report.append("| Metric | Score |")
        report.append("|--------|-------|")
        for key, val in metrics.items():
            label = key.replace("_", " ").title()
            bar = "█" * val + "░" * (10 - val)
            report.append(f"| {label} | {bar} {val}/10 |")
        report.append("")

    # Issues
    if issues:
        sorted_issues = sort_issues_by_severity(issues)
        report.append(f"## Issues Found ({len(issues)})\n")
        for issue in sorted_issues:
            sev = issue.get("severity", "Low")
            emoji = SEVERITY_EMOJI.get(sev, "⚪")
            cat_emoji = CATEGORY_EMOJI.get(issue.get("category", ""), "📋")
            report.append(f"### {emoji} [{sev}] {cat_emoji} {issue.get('title', 'Issue')}")
            report.append(f"\n**Category:** {issue.get('category', 'N/A')} | "
                          f"**Line:** {issue.get('line_reference', 'N/A')}\n")
            report.append(f"**Description:** {issue.get('description', 'N/A')}\n")

            if issue.get("problematic_code"):
                report.append(f"**❌ Problematic Code:**\n```{language.lower()}\n"
                              f"{issue['problematic_code']}\n```\n")
            if issue.get("suggested_fix"):
                report.append(f"**✅ Best Practice Fix:**\n```{language.lower()}\n"
                              f"{issue['suggested_fix']}\n```\n")
            if issue.get("explanation"):
                report.append(f"**📖 Learn:** {issue['explanation']}\n")
            if issue.get("learning_reference"):
                report.append(f"**🔗 Reference:** {issue['learning_reference']}\n")
            report.append("---\n")

    # Strengths
    if strengths:
        report.append("## ✨ Strengths\n")
        for s in strengths:
            report.append(f"- {s}")
        report.append("")

    # Original Code
    report.append(f"\n## Reviewed Code\n\n```{language.lower()}\n{code}\n```\n")

    return "\n".join(report)
