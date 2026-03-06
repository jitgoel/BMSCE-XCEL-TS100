def calculate_score(found_skills,required_skills):
    if len(required_skills)==0:
        return 0
    match=0
    for skill in required_skills:
        if skill in found_skills:
            match+=1
    score=(match/len(required_skills))*100
    return round(score,2)

def missing_skills(found_skills,required_skills):
    missing=[]
    for skill in required_skills:
        if skill not in found_skills:
            missing.append(skill)
    return missing