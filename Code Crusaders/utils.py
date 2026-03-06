"""
Utility functions for the AI Code Review Assistant.
Handles language detection, JSON parsing, and report generation.
"""

import json
import re
import difflib
from datetime import datetime


# ─── Code Diff Generator ────────────────────────────────────────────────────

def generate_diff_html(original: str, optimized: str) -> str:
    """
    Generate a styled HTML diff view comparing original and optimized code.
    Uses difflib for unified diff and renders with dark-theme red/green highlighting.
    """
    original_lines = original.splitlines()
    optimized_lines = optimized.splitlines()

    diff = list(difflib.unified_diff(
        original_lines, optimized_lines,
        fromfile="Original", tofile="Optimized",
        lineterm="",
    ))

    if not diff:
        return '<div style="padding: 1rem; color: #10b981; text-align: center;">✅ No differences — code is already optimal!</div>'

    # Count changes
    added = sum(1 for line in diff if line.startswith("+") and not line.startswith("+++"))
    removed = sum(1 for line in diff if line.startswith("-") and not line.startswith("---"))

    html_parts = []
    html_parts.append(f"""
    <div style="background: #0d1117; border: 1px solid #30363d; border-radius: 12px; overflow: hidden; font-family: 'JetBrains Mono', 'Consolas', monospace; font-size: 0.82rem; margin: 0.5rem 0;">
        <div style="background: #161b22; padding: 0.6rem 1rem; border-bottom: 1px solid #30363d; display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #c9d1d9; font-weight: 600;">📄 Code Diff</span>
            <span>
                <span style="color: #3fb950; font-weight: 600;">+{added} additions</span>
                &nbsp;&nbsp;
                <span style="color: #f85149; font-weight: 600;">-{removed} deletions</span>
            </span>
        </div>
        <div style="overflow-x: auto; padding: 0;">
    """)

    line_num_old = 0
    line_num_new = 0

    for line in diff:
        # Escape HTML
        escaped = line.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

        if line.startswith("@@"):
            # Hunk header
            html_parts.append(
                f'<div style="background: rgba(56,139,253,0.1); color: #58a6ff; padding: 0.3rem 1rem; '
                f'border-top: 1px solid #30363d; border-bottom: 1px solid #30363d; font-size: 0.78rem;">'
                f'{escaped}</div>'
            )
            # Parse line numbers from @@ header
            import re as _re
            match = _re.search(r"@@ -(\d+)", line)
            if match:
                line_num_old = int(match.group(1)) - 1
            match2 = _re.search(r"\+(\d+)", line)
            if match2:
                line_num_new = int(match2.group(1)) - 1
        elif line.startswith("---") or line.startswith("+++"):
            continue  # Skip file headers
        elif line.startswith("-"):
            line_num_old += 1
            html_parts.append(
                f'<div style="background: rgba(248,81,73,0.1); color: #ffa198; padding: 0.15rem 1rem; '
                f'border-left: 3px solid #f85149;">'
                f'<span style="color: #6e7681; min-width: 3rem; display: inline-block; user-select: none;">{line_num_old:>4}  </span>'
                f'<span style="color: #f85149; font-weight: 600;">-</span> {escaped[1:]}</div>'
            )
        elif line.startswith("+"):
            line_num_new += 1
            html_parts.append(
                f'<div style="background: rgba(63,185,80,0.1); color: #aff5b4; padding: 0.15rem 1rem; '
                f'border-left: 3px solid #3fb950;">'
                f'<span style="color: #6e7681; min-width: 3rem; display: inline-block; user-select: none;">{line_num_new:>4}  </span>'
                f'<span style="color: #3fb950; font-weight: 600;">+</span> {escaped[1:]}</div>'
            )
        else:
            line_num_old += 1
            line_num_new += 1
            html_parts.append(
                f'<div style="color: #c9d1d9; padding: 0.15rem 1rem;">'
                f'<span style="color: #6e7681; min-width: 3rem; display: inline-block; user-select: none;">{line_num_new:>4}  </span>'
                f'<span style="color: #6e7681;"> </span> {escaped[1:]}</div>'
            )

    html_parts.append("</div></div>")
    return "".join(html_parts)


def generate_split_diff_html(original: str, optimized: str) -> str:
    """
    Generate a GitHub-style side-by-side (split) diff view.
    Left column shows original code, right column shows optimized code.
    """
    original_lines = original.splitlines()
    optimized_lines = optimized.splitlines()
    sm = difflib.SequenceMatcher(None, original_lines, optimized_lines)

    # Count changes
    added = 0
    removed = 0
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "insert":
            added += j2 - j1
        elif tag == "delete":
            removed += i2 - i1
        elif tag == "replace":
            added += j2 - j1
            removed += i2 - i1

    if added == 0 and removed == 0:
        return '<div style="padding: 1rem; color: #10b981; text-align: center;">✅ No differences — code is already optimal!</div>'

    rows = []
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            for k in range(i2 - i1):
                left_num = i1 + k + 1
                right_num = j1 + k + 1
                text = original_lines[i1 + k].replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                rows.append(
                    f'<tr>'
                    f'<td class="ln">{left_num}</td>'
                    f'<td class="eq">{text}</td>'
                    f'<td class="ln">{right_num}</td>'
                    f'<td class="eq">{text}</td>'
                    f'</tr>'
                )
        elif tag == "replace":
            max_len = max(i2 - i1, j2 - j1)
            for k in range(max_len):
                # Left side
                if i1 + k < i2:
                    left_num = i1 + k + 1
                    left_text = original_lines[i1 + k].replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                    left_cls = "del"
                else:
                    left_num = ""
                    left_text = ""
                    left_cls = "empty"
                # Right side
                if j1 + k < j2:
                    right_num = j1 + k + 1
                    right_text = optimized_lines[j1 + k].replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                    right_cls = "add"
                else:
                    right_num = ""
                    right_text = ""
                    right_cls = "empty"
                rows.append(
                    f'<tr>'
                    f'<td class="ln">{left_num}</td>'
                    f'<td class="{left_cls}">{left_text}</td>'
                    f'<td class="ln">{right_num}</td>'
                    f'<td class="{right_cls}">{right_text}</td>'
                    f'</tr>'
                )
        elif tag == "delete":
            for k in range(i2 - i1):
                left_num = i1 + k + 1
                left_text = original_lines[i1 + k].replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                rows.append(
                    f'<tr>'
                    f'<td class="ln">{left_num}</td>'
                    f'<td class="del">{left_text}</td>'
                    f'<td class="ln"></td>'
                    f'<td class="empty"></td>'
                    f'</tr>'
                )
        elif tag == "insert":
            for k in range(j2 - j1):
                right_num = j1 + k + 1
                right_text = optimized_lines[j1 + k].replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                rows.append(
                    f'<tr>'
                    f'<td class="ln"></td>'
                    f'<td class="empty"></td>'
                    f'<td class="ln">{right_num}</td>'
                    f'<td class="add">{right_text}</td>'
                    f'</tr>'
                )

    rows_html = "\n".join(rows)
    return f"""
    <div style="background: #0d1117; border: 1px solid #30363d; border-radius: 12px; overflow: hidden; font-family: 'JetBrains Mono', 'Consolas', monospace; font-size: 0.8rem; margin: 0.5rem 0;">
        <div style="background: #161b22; padding: 0.6rem 1rem; border-bottom: 1px solid #30363d; display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #c9d1d9; font-weight: 600;">📄 Split Diff</span>
            <span>
                <span style="color: #3fb950; font-weight: 600;">+{added} additions</span>&nbsp;&nbsp;
                <span style="color: #f85149; font-weight: 600;">-{removed} deletions</span>
            </span>
        </div>
        <style>
            .diff-split-table {{ width: 100%; border-collapse: collapse; table-layout: fixed; }}
            .diff-split-table td {{ padding: 0.15rem 0.5rem; white-space: pre; overflow-x: auto; vertical-align: top; }}
            .diff-split-table .ln {{ width: 3rem; min-width: 3rem; max-width: 3rem; color: #6e7681; text-align: right; user-select: none; padding-right: 0.8rem; border-right: 1px solid #21262d; }}
            .diff-split-table .eq {{ color: #c9d1d9; }}
            .diff-split-table .del {{ background: rgba(248,81,73,0.12); color: #ffa198; border-left: 3px solid #f85149; }}
            .diff-split-table .add {{ background: rgba(63,185,80,0.12); color: #aff5b4; border-left: 3px solid #3fb950; }}
            .diff-split-table .empty {{ background: rgba(110,118,129,0.05); color: #30363d; }}
        </style>
        <div style="overflow-x: auto;">
            <table class="diff-split-table">
                <colgroup><col style="width:3rem"><col style="width:calc(50% - 3rem)"><col style="width:3rem"><col style="width:calc(50% - 3rem)"></colgroup>
                {rows_html}
            </table>
        </div>
    </div>
    """


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
