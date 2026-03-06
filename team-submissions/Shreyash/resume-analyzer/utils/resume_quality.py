def project_score(text):

    text=text.lower()

    action_words=[
        "developed",
        "built",
        "designed",
        "implemented",
        "optimized",
        "engineered"
    ]

    technical_terms=[
        "model",
        "pipeline",
        "system",
        "analysis",
        "prediction",
        "classification",
        "deployment",
        "architecture"
    ]

    impact_terms=[
        "improved",
        "increased",
        "reduced",
        "accuracy",
        "performance",
        "latency",
        "efficiency"
    ]

    action_count=0
    for word in action_words:
        if word in text:
            action_count+=1

    tech_count=0
    for word in technical_terms:
        if word in text:
            tech_count+=1

    impact_count=0
    for word in impact_terms:
        if word in text:
            impact_count+=1

    score=(action_count*10)+(tech_count*8)+(impact_count*12)

    return min(score,100)


def experience_score(text):

    text=text.lower()

    role_terms=[
        "intern",
        "engineer",
        "developer",
        "analyst",
        "scientist"
    ]

    responsibility_terms=[
        "worked",
        "collaborated",
        "managed",
        "built",
        "implemented",
        "designed"
    ]

    team_terms=[
        "team",
        "stakeholders",
        "clients",
        "organization"
    ]

    role_score=0
    for word in role_terms:
        if word in text:
            role_score+=12

    resp_score=0
    for word in responsibility_terms:
        if word in text:
            resp_score+=8

    team_score=0
    for word in team_terms:
        if word in text:
            team_score+=5

    score=role_score+resp_score+team_score

    return min(score,100)


def structure_score(text):

    text=text.lower()

    score=0

    sections=[
        "skills",
        "projects",
        "experience",
        "education",
        "summary"
    ]

    for sec in sections:
        if sec in text:
            score+=10

    lines=text.split("\n")

    if len(lines)>25:
        score+=20

    bullet_markers=["•","-","*"]

    bullet_count=0
    for line in lines:
        for b in bullet_markers:
            if b in line:
                bullet_count+=1

    if bullet_count>=4:
        score+=20

    word_count=len(text.split())

    if word_count>250:
        score+=20

    return min(score,100)


def skill_density_score(text,found_skills):

    words=text.split()

    if len(words)==0:
        return 0

    unique_words=set(words)

    density=len(found_skills)/len(unique_words)

    score=density*800

    if len(found_skills)<4:
        score=score*0.5

    return min(score,100)