def classify_sections(text):

    sections={
        "skills":["skills","technical skills","tech stack"],
        "projects":["projects","project experience"],
        "experience":["experience","work experience","employment"],
        "education":["education","academic background"],
        "summary":["summary","profile","about"]
    }

    detected={}

    lower=text.lower()

    for sec,keywords in sections.items():

        found=False

        for k in keywords:
            if k in lower:
                found=True
                break

        detected[sec]=found

    return detected