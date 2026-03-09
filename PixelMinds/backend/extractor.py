"""
Resume Data Extractor
Uses pdfplumber (PDF), python-docx (DOCX), spaCy NER, and regex-based rules
to extract structured resume data.
"""

import re
import pdfplumber
from docx import Document

# spaCy disabled — requires compiled thinc/confection incompatible with Python 3.14
# The extractor uses regex-based extraction as a fully functional fallback
nlp = None


# ─── Text Extraction ───────────────────────────────────────────────

def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text.strip()


def extract_text_from_docx(file_path: str) -> str:
    doc = Document(file_path)
    return "\n".join([para.text for para in doc.paragraphs if para.text.strip()])


def extract_text(file_path: str, ext: str) -> str:
    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext in (".doc", ".docx"):
        return extract_text_from_docx(file_path)
    else:
        raise ValueError(f"Unsupported file extension: {ext}")


# ─── Regex Patterns ────────────────────────────────────────────────

EMAIL_PATTERN = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")
PHONE_PATTERN = re.compile(
    r"(?:\+?\d{1,3}[\s\-]?)?\(?\d{2,4}\)?[\s\-]?\d{3,4}[\s\-]?\d{3,4}"
)
LINKEDIN_PATTERN = re.compile(
    r"(?:https?://)?(?:www\.)?linkedin\.com/in/[\w\-]+/?", re.IGNORECASE
)
GITHUB_PATTERN = re.compile(
    r"(?:https?://)?(?:www\.)?github\.com/[\w\-]+/?", re.IGNORECASE
)
URL_PATTERN = re.compile(r"https?://[^\s,)]+")

# Section headers commonly found in resumes
SECTION_PATTERNS = {
    "summary": re.compile(
        r"^(?:summary|objective|profile|about\s*me|professional\s*summary|career\s*objective)",
        re.IGNORECASE | re.MULTILINE,
    ),
    "experience": re.compile(
        r"^(?:experience|work\s*experience|professional\s*experience|employment|work\s*history)",
        re.IGNORECASE | re.MULTILINE,
    ),
    "education": re.compile(
        r"^(?:education|academic|qualifications|educational\s*background)",
        re.IGNORECASE | re.MULTILINE,
    ),
    "skills": re.compile(
        r"^(?:skills|technical\s*skills|core\s*competencies|technologies|tech\s*stack)",
        re.IGNORECASE | re.MULTILINE,
    ),
    "projects": re.compile(
        r"^(?:projects|personal\s*projects|academic\s*projects|key\s*projects)",
        re.IGNORECASE | re.MULTILINE,
    ),
    "certifications": re.compile(
        r"^(?:certifications?|licenses?|certificates?)",
        re.IGNORECASE | re.MULTILINE,
    ),
    "achievements": re.compile(
        r"^(?:achievements?|awards?|honors?|accomplishments?)",
        re.IGNORECASE | re.MULTILINE,
    ),
}

# Common technical skills for classification
TECHNICAL_SKILLS_DB = {
    "python", "javascript", "typescript", "java", "c++", "c#", "c", "go", "golang",
    "rust", "ruby", "php", "swift", "kotlin", "scala", "r", "matlab", "perl",
    "html", "css", "sass", "less", "sql", "nosql", "graphql", "rest", "api",
    "react", "reactjs", "react.js", "angular", "vue", "vue.js", "vuejs", "svelte",
    "next.js", "nextjs", "nuxt", "nuxt.js", "gatsby", "express", "express.js",
    "node", "node.js", "nodejs", "django", "flask", "fastapi", "spring", "spring boot",
    "rails", "ruby on rails", "laravel", "asp.net", ".net",
    "tensorflow", "pytorch", "keras", "scikit-learn", "pandas", "numpy", "opencv",
    "docker", "kubernetes", "k8s", "aws", "azure", "gcp", "google cloud",
    "terraform", "ansible", "jenkins", "ci/cd", "github actions", "gitlab ci",
    "mongodb", "postgresql", "postgres", "mysql", "redis", "elasticsearch",
    "dynamodb", "cassandra", "firebase", "supabase",
    "git", "linux", "bash", "powershell", "nginx", "apache",
    "machine learning", "deep learning", "nlp", "computer vision", "ai",
    "data science", "data engineering", "data analysis",
    "microservices", "serverless", "lambda", "blockchain", "web3",
}

TOOLS_DB = {
    "git", "github", "gitlab", "bitbucket", "jira", "confluence", "trello",
    "slack", "figma", "sketch", "adobe xd", "photoshop", "illustrator",
    "vs code", "vscode", "intellij", "pycharm", "webstorm", "eclipse",
    "postman", "insomnia", "swagger", "docker desktop",
    "tableau", "power bi", "grafana", "kibana", "datadog", "sentry",
    "notion", "asana", "monday.com", "clickup",
    "webpack", "vite", "babel", "eslint", "prettier", "jest", "mocha",
    "cypress", "selenium", "playwright",
}

SOFT_SKILLS_DB = {
    "leadership", "communication", "teamwork", "problem solving", "problem-solving",
    "critical thinking", "time management", "adaptability", "creativity",
    "collaboration", "mentoring", "agile", "scrum", "project management",
    "strategic planning", "decision making", "conflict resolution",
    "presentation", "public speaking", "negotiation", "customer service",
}

LANGUAGES_DB = {
    "english", "spanish", "french", "german", "mandarin", "chinese",
    "hindi", "arabic", "portuguese", "japanese", "korean", "italian",
    "russian", "dutch", "swedish", "tamil", "telugu", "kannada",
    "bengali", "marathi", "gujarati", "punjabi", "urdu", "malayalam",
}

DATE_PATTERN = re.compile(
    r"(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s.,]*\d{4}|"
    r"\d{1,2}/\d{4}|\d{4}\s*[-–]\s*(?:present|current|\d{4})",
    re.IGNORECASE,
)


# ─── Section Splitting ─────────────────────────────────────────────

def split_into_sections(text: str) -> dict:
    """Split resume text into sections based on common headers."""
    lines = text.split("\n")
    sections = {}
    current_section = "header"
    sections[current_section] = []

    for line in lines:
        matched = False
        for section_name, pattern in SECTION_PATTERNS.items():
            if pattern.match(line.strip()):
                current_section = section_name
                sections[current_section] = []
                matched = True
                break
        if not matched:
            if current_section not in sections:
                sections[current_section] = []
            sections[current_section].append(line)

    # Join lines back into text
    return {k: "\n".join(v).strip() for k, v in sections.items() if "\n".join(v).strip()}


# ─── Extraction Functions ──────────────────────────────────────────

def extract_personal_info(text: str, header_text: str) -> dict:
    """Extract personal info using regex and spaCy NER."""
    personal = {
        "name": "",
        "email": "",
        "phone": "",
        "linkedin": "",
        "github": "",
        "location": "",
    }

    # Email
    emails = EMAIL_PATTERN.findall(text)
    if emails:
        personal["email"] = emails[0]

    # Phone
    phones = PHONE_PATTERN.findall(text)
    if phones:
        personal["phone"] = phones[0].strip()

    # LinkedIn
    linkedin = LINKEDIN_PATTERN.findall(text)
    if linkedin:
        personal["linkedin"] = linkedin[0]

    # GitHub
    github = GITHUB_PATTERN.findall(text)
    if github:
        personal["github"] = github[0]

    # Name — use spaCy NER on header section, or fall back to first line
    if nlp and header_text:
        doc = nlp(header_text[:500])
        for ent in doc.ents:
            if ent.label_ == "PERSON":
                personal["name"] = ent.text
                break

    if not personal["name"] and header_text:
        # Fallback: first non-empty line that doesn't look like contact info
        for line in header_text.split("\n"):
            line = line.strip()
            if (
                line
                and not EMAIL_PATTERN.search(line)
                and not PHONE_PATTERN.search(line)
                and not URL_PATTERN.search(line)
                and len(line) < 60
            ):
                personal["name"] = line
                break

    # Location — use spaCy NER
    if nlp:
        doc = nlp(header_text[:500] if header_text else text[:500])
        for ent in doc.ents:
            if ent.label_ in ("GPE", "LOC"):
                personal["location"] = ent.text
                break

    return personal


def extract_summary(section_text: str) -> str:
    """Extract professional summary."""
    if section_text:
        return section_text.strip()
    return ""


def extract_skills(text: str, skills_section: str) -> dict:
    """Classify skills into technical, soft, tools, and languages."""
    skills = {
        "technical": [],
        "soft": [],
        "tools": [],
        "languages": [],
    }

    search_text = (skills_section + " " + text).lower()

    for skill in TECHNICAL_SKILLS_DB:
        if skill.lower() in search_text:
            skills["technical"].append(skill.title() if len(skill) > 3 else skill.upper())

    for tool in TOOLS_DB:
        if tool.lower() in search_text and tool.lower() not in [s.lower() for s in skills["technical"]]:
            skills["tools"].append(tool.title())

    for skill in SOFT_SKILLS_DB:
        if skill.lower() in search_text:
            skills["soft"].append(skill.title())

    for lang in LANGUAGES_DB:
        if lang.lower() in search_text:
            skills["languages"].append(lang.title())

    # Deduplicate
    for key in skills:
        skills[key] = list(dict.fromkeys(skills[key]))

    return skills


def extract_experience(section_text: str) -> list:
    """Extract work experience entries."""
    if not section_text:
        return []

    experiences = []
    # Split by double newlines or patterns that look like new entries
    entries = re.split(r"\n{2,}", section_text)

    for entry in entries:
        if not entry.strip():
            continue

        exp = {
            "company": "",
            "role": "",
            "duration": "",
            "start_date": "",
            "end_date": "",
            "responsibilities": [],
            "technologies_used": [],
        }

        lines = [l.strip() for l in entry.split("\n") if l.strip()]
        if not lines:
            continue

        # Try to identify company/role from first lines
        if nlp:
            doc = nlp(lines[0] if lines else "")
            for ent in doc.ents:
                if ent.label_ == "ORG":
                    exp["company"] = ent.text
                    break

        # First line often has role/company
        if lines:
            exp["role"] = lines[0]

        # Look for dates
        dates = DATE_PATTERN.findall(entry)
        if len(dates) >= 2:
            exp["start_date"] = dates[0]
            exp["end_date"] = dates[1]
            exp["duration"] = f"{dates[0]} - {dates[1]}"
        elif len(dates) == 1:
            exp["start_date"] = dates[0]
            exp["duration"] = dates[0]

        # Responsibilities: lines starting with bullet points or dashes
        for line in lines[1:]:
            cleaned = re.sub(r"^[\-•▪▸►◆○●\*]\s*", "", line).strip()
            if cleaned and not DATE_PATTERN.match(cleaned):
                exp["responsibilities"].append(cleaned)

        # Technologies mentioned
        entry_lower = entry.lower()
        for skill in TECHNICAL_SKILLS_DB:
            if skill.lower() in entry_lower:
                exp["technologies_used"].append(
                    skill.title() if len(skill) > 3 else skill.upper()
                )

        if exp["role"] or exp["company"]:
            experiences.append(exp)

    return experiences


def extract_education(section_text: str) -> list:
    """Extract education entries."""
    if not section_text:
        return []

    education = []
    entries = re.split(r"\n{2,}", section_text)

    for entry in entries:
        if not entry.strip():
            continue

        edu = {
            "institution": "",
            "degree": "",
            "field": "",
            "year": "",
            "gpa": "",
        }

        lines = [l.strip() for l in entry.split("\n") if l.strip()]
        if not lines:
            continue

        # Use spaCy for organization names
        if nlp:
            doc = nlp(entry[:300])
            for ent in doc.ents:
                if ent.label_ == "ORG" and not edu["institution"]:
                    edu["institution"] = ent.text

        # Degree patterns
        degree_match = re.search(
            r"(?:bachelor|master|ph\.?d|b\.?s\.?|m\.?s\.?|b\.?a\.?|m\.?a\.?|b\.?tech|m\.?tech|b\.?e\.?|m\.?e\.?|mba|bba|associate|diploma)",
            entry,
            re.IGNORECASE,
        )
        if degree_match:
            edu["degree"] = degree_match.group(0)

        # Year
        year_match = re.findall(r"\b(19|20)\d{2}\b", entry)
        if year_match:
            edu["year"] = year_match[-1] if len(year_match) == 1 else f"{year_match[0]} - {year_match[-1]}"

        # GPA
        gpa_match = re.search(r"(?:gpa|cgpa|grade)[:\s]*(\d+\.?\d*)", entry, re.IGNORECASE)
        if gpa_match:
            edu["gpa"] = gpa_match.group(1)

        # If no institution found, use first line
        if not edu["institution"] and lines:
            edu["institution"] = lines[0]

        # Field of study — look for "in ..." after degree
        field_match = re.search(
            r"(?:in|of)\s+([A-Z][a-zA-Z\s&]+?)(?:\s*[-,\n]|\s*$)",
            entry,
        )
        if field_match:
            edu["field"] = field_match.group(1).strip()

        if edu["institution"] or edu["degree"]:
            education.append(edu)

    return education


def extract_projects(section_text: str) -> list:
    """Extract project entries."""
    if not section_text:
        return []

    projects = []
    entries = re.split(r"\n{2,}", section_text)

    for entry in entries:
        if not entry.strip():
            continue

        project = {
            "name": "",
            "description": "",
            "technologies": [],
            "link": "",
        }

        lines = [l.strip() for l in entry.split("\n") if l.strip()]
        if not lines:
            continue

        project["name"] = re.sub(r"^[\-•▪▸►◆○●\*]\s*", "", lines[0]).strip()

        # Description from remaining lines
        desc_lines = []
        for line in lines[1:]:
            cleaned = re.sub(r"^[\-•▪▸►◆○●\*]\s*", "", line).strip()
            if cleaned:
                desc_lines.append(cleaned)
        project["description"] = " ".join(desc_lines)

        # Links
        urls = URL_PATTERN.findall(entry)
        if urls:
            project["link"] = urls[0]

        # Technologies
        entry_lower = entry.lower()
        for skill in TECHNICAL_SKILLS_DB:
            if skill.lower() in entry_lower:
                project["technologies"].append(
                    skill.title() if len(skill) > 3 else skill.upper()
                )

        if project["name"]:
            projects.append(project)

    return projects


def extract_certifications(section_text: str) -> list:
    """Extract certifications."""
    if not section_text:
        return []
    certs = []
    for line in section_text.split("\n"):
        cleaned = re.sub(r"^[\-•▪▸►◆○●\*\d.)\]]\s*", "", line).strip()
        if cleaned:
            certs.append(cleaned)
    return certs


def extract_achievements(section_text: str) -> list:
    """Extract achievements/awards."""
    if not section_text:
        return []
    achievements = []
    for line in section_text.split("\n"):
        cleaned = re.sub(r"^[\-•▪▸►◆○●\*\d.)\]]\s*", "", line).strip()
        if cleaned:
            achievements.append(cleaned)
    return achievements


# ─── Main Extraction Pipeline ──────────────────────────────────────

def extract_resume_data(file_path: str, ext: str) -> dict:
    """
    Main pipeline: extract text → split sections → extract structured fields.
    Returns the full structured JSON.
    """
    raw_text = extract_text(file_path, ext)
    if not raw_text:
        raise ValueError("Could not extract text from the resume file")

    sections = split_into_sections(raw_text)

    result = {
        "personal": extract_personal_info(
            raw_text, sections.get("header", "")
        ),
        "summary": extract_summary(sections.get("summary", "")),
        "skills": extract_skills(raw_text, sections.get("skills", "")),
        "experience": extract_experience(sections.get("experience", "")),
        "education": extract_education(sections.get("education", "")),
        "projects": extract_projects(sections.get("projects", "")),
        "certifications": extract_certifications(
            sections.get("certifications", "")
        ),
        "achievements": extract_achievements(sections.get("achievements", "")),
        "_raw_text": raw_text,
    }

    return result
