from pypdf import PdfReader
import spacy

nlp = spacy.load("en_core_web_sm")

skills_db = [
    "python",
    "java",
    "machine learning",
    "deep learning",
    "react",
    "node",
    "sql",
    "docker",
    "kubernetes",
    "tensorflow",
]

def extract_text(file):

    reader = PdfReader(file)
    text = ""

    for page in reader.pages:
        text += page.extract_text()

    return text


def extract_skills(text):

    found = []

    for skill in skills_db:
        if skill.lower() in text.lower():
            found.append(skill)

    return found


def parse_resume(file):

    text = extract_text(file)

    skills = extract_skills(text)

    return {
        "text": text[:2000],
        "skills": skills
    }