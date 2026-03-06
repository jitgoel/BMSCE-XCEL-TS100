"""
Static Code Analyzer for the AI Code Review Assistant.
Performs local analysis without LLM calls — computes metrics, detects anti-patterns,
and provides instant feedback on code quality.
"""

import re
import ast
from typing import Optional


class CodeAnalyzer:
    """Performs static analysis on source code to extract metrics and detect common issues."""

    def __init__(self, code: str, language: str = "Python"):
        self.code = code
        self.language = language.lower()
        self.lines = code.split("\n")
        self.total_lines = len(self.lines)
        self.non_empty_lines = sum(1 for line in self.lines if line.strip())
        self.comment_lines = 0
        self.functions = []
        self.classes = []
        self.imports = []
        self.issues = []

        self._analyze()

    def _analyze(self):
        """Run all analysis passes."""
        self._count_comments()
        self._detect_anti_patterns()

        if self.language in ("python",):
            self._analyze_python_ast()

    # ─── Comment Counting ────────────────────────────────────────────────

    def _count_comments(self):
        """Count comment lines based on language."""
        comment_markers = {
            "python": "#",
            "javascript": "//",
            "typescript": "//",
            "java": "//",
            "c++": "//",
            "c": "//",
            "c#": "//",
            "go": "//",
            "rust": "//",
            "ruby": "#",
            "php": "//",
            "swift": "//",
            "kotlin": "//",
            "shell/bash": "#",
        }
        marker = comment_markers.get(self.language, "#")
        self.comment_lines = sum(
            1 for line in self.lines if line.strip().startswith(marker)
        )

    # ─── Python AST Analysis ─────────────────────────────────────────────

    def _analyze_python_ast(self):
        """Use Python's AST module for deeper analysis of Python code."""
        try:
            tree = ast.parse(self.code)
        except SyntaxError as e:
            self.issues.append({
                "type": "Syntax Error",
                "severity": "Critical",
                "message": f"Syntax error at line {e.lineno}: {e.msg}",
                "line": e.lineno,
            })
            return

        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef) or isinstance(node, ast.AsyncFunctionDef):
                self.functions.append({
                    "name": node.name,
                    "line": node.lineno,
                    "args": len(node.args.args),
                    "decorators": len(node.decorator_list),
                    "body_lines": node.end_lineno - node.lineno + 1 if node.end_lineno else 0,
                })
            elif isinstance(node, ast.ClassDef):
                self.classes.append({
                    "name": node.name,
                    "line": node.lineno,
                    "methods": sum(
                        1 for n in ast.walk(node) if isinstance(n, ast.FunctionDef)
                    ),
                })
            elif isinstance(node, ast.Import):
                for alias in node.names:
                    self.imports.append(alias.name)
            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    self.imports.append(node.module)

    # ─── Anti-Pattern Detection ──────────────────────────────────────────

    def _detect_anti_patterns(self):
        """Detect common anti-patterns and security issues."""

        for i, line in enumerate(self.lines, 1):
            stripped = line.strip()

            # Hardcoded credentials
            if re.search(
                r'(password|passwd|pwd|secret|api_key|apikey|token|auth)\s*=\s*["\'][^"\']+["\']',
                stripped,
                re.IGNORECASE,
            ):
                self.issues.append({
                    "type": "Security",
                    "severity": "Critical",
                    "message": "Possible hardcoded credential detected",
                    "line": i,
                })

            # eval() / exec() usage
            if re.search(r"\b(eval|exec)\s*\(", stripped):
                self.issues.append({
                    "type": "Security",
                    "severity": "High",
                    "message": "Use of eval()/exec() — potential code injection risk",
                    "line": i,
                })

            # Bare except
            if stripped == "except:" or stripped.startswith("except:"):
                self.issues.append({
                    "type": "Best Practice",
                    "severity": "Medium",
                    "message": "Bare 'except:' catches all exceptions including SystemExit and KeyboardInterrupt",
                    "line": i,
                })

            # SQL injection patterns
            if re.search(
                r'(execute|cursor\.execute)\s*\(\s*["\'].*%s|format\s*\(|f["\'].*\{',
                stripped,
            ) and re.search(r"(SELECT|INSERT|UPDATE|DELETE|DROP)", stripped, re.IGNORECASE):
                self.issues.append({
                    "type": "Security",
                    "severity": "Critical",
                    "message": "Potential SQL injection — use parameterized queries",
                    "line": i,
                })

            # TODO/FIXME/HACK comments
            if re.search(r"#\s*(TODO|FIXME|HACK|XXX|BUG)", stripped, re.IGNORECASE):
                self.issues.append({
                    "type": "Style",
                    "severity": "Low",
                    "message": f"Unresolved TODO/FIXME comment",
                    "line": i,
                })

            # Magic numbers (numbers not assigned to named constants)
            if self.language == "python" and re.search(
                r"(?<!=)\s+\b\d{3,}\b(?!\s*[=\]])", stripped
            ) and not stripped.startswith("#") and "import" not in stripped:
                self.issues.append({
                    "type": "Style",
                    "severity": "Low",
                    "message": "Magic number detected — consider using a named constant",
                    "line": i,
                })

    # ─── Complexity Estimation ───────────────────────────────────────────

    def estimate_complexity(self) -> int:
        """
        Estimate cyclomatic complexity based on branching keywords.
        This is a simplified heuristic, not a full control-flow analysis.
        """
        complexity_keywords = {
            "python": [r"\bif\b", r"\belif\b", r"\bfor\b", r"\bwhile\b",
                       r"\band\b", r"\bor\b", r"\bexcept\b"],
            "javascript": [r"\bif\b", r"\belse\s+if\b", r"\bfor\b", r"\bwhile\b",
                           r"\bcase\b", r"\b\?\b", r"\&\&", r"\|\|", r"\bcatch\b"],
            "java": [r"\bif\b", r"\belse\s+if\b", r"\bfor\b", r"\bwhile\b",
                     r"\bcase\b", r"\bcatch\b", r"\&\&", r"\|\|"],
        }

        # Default to Python-like keywords
        keywords = complexity_keywords.get(self.language, complexity_keywords["python"])
        complexity = 1  # Base complexity

        for line in self.lines:
            for pattern in keywords:
                complexity += len(re.findall(pattern, line))

        return complexity

    # ─── Public API ──────────────────────────────────────────────────────

    def get_metrics(self) -> dict:
        """Return a comprehensive metrics dictionary."""
        complexity = self.estimate_complexity()
        comment_ratio = (
            round(self.comment_lines / self.non_empty_lines * 100, 1)
            if self.non_empty_lines > 0
            else 0
        )

        # Check for long functions (Python)
        long_functions = [f for f in self.functions if f.get("body_lines", 0) > 50]
        complex_functions = [f for f in self.functions if f.get("args", 0) > 5]

        return {
            "total_lines": self.total_lines,
            "non_empty_lines": self.non_empty_lines,
            "comment_lines": self.comment_lines,
            "comment_ratio": comment_ratio,
            "function_count": len(self.functions),
            "class_count": len(self.classes),
            "import_count": len(self.imports),
            "cyclomatic_complexity": complexity,
            "long_functions": len(long_functions),
            "complex_functions": len(complex_functions),
            "static_issues": len(self.issues),
        }

    def get_static_issues(self) -> list:
        """Return all detected static analysis issues."""
        return self.issues

    def get_functions_summary(self) -> list:
        """Return summary of all detected functions."""
        return self.functions

    def get_classes_summary(self) -> list:
        """Return summary of all detected classes."""
        return self.classes
