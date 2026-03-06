import json
import spacy

nlp = spacy.load("en_core_web_sm")

def load_skills(path):
    with open(path,"r") as f:
        data=json.load(f)
    return data["skills"]


def extract_skills(text,skills):

    text=text.lower()

    doc=nlp(text)

    found=set()

    for token in doc:
        word=token.text.lower()

        if word in skills:
            found.add(word)

    for chunk in doc.noun_chunks:
        phrase=chunk.text.lower()

        if phrase in skills:
            found.add(phrase)

    return list(found)


def get_required_skills(job_role):

    role=job_role.lower()

    role_skills={

        "data scientist":[
            "python","pandas","numpy","machine learning","sql",
            "tensorflow","scikit-learn","statistics","data visualization"
        ],

        "machine learning engineer":[
            "python","pytorch","tensorflow","machine learning",
            "docker","kubernetes","aws","mlops"
        ],

        "data analyst":[
            "python","sql","pandas","tableau","powerbi",
            "excel","data visualization"
        ],

        "software engineer":[
            "python","java","git","docker","linux",
            "react","nodejs","api","sql"
        ],

        "backend developer":[
            "python","java","nodejs","api","sql",
            "docker","redis","postgresql"
        ],

        "frontend developer":[
            "javascript","react","html","css",
            "typescript","web development"
        ],

        "full stack developer":[
            "javascript","react","nodejs","html","css",
            "mongodb","api","docker"
        ],

        "devops engineer":[
            "docker","kubernetes","linux","aws",
            "ci/cd","terraform","cloud"
        ],

        "cloud engineer":[
            "aws","gcp","azure","docker",
            "kubernetes","linux","cloud architecture"
        ],

        "ai engineer":[
            "python","machine learning","deep learning",
            "tensorflow","pytorch","nlp","computer vision"
        ],

        "nlp engineer":[
            "python","nlp","spacy","transformers",
            "machine learning","deep learning"
        ],

        "computer vision engineer":[
            "python","opencv","computer vision",
            "deep learning","tensorflow","pytorch"
        ],

        "mobile developer":[
            "java","kotlin","android","flutter",
            "react native","mobile development"
        ],

        "cybersecurity engineer":[
            "linux","network security","python",
            "penetration testing","cryptography"
        ]
    }

    for key in role_skills:
        if key in role:
            return role_skills[key]

    return role_skills["software engineer"]