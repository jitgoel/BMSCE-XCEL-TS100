def analyze_skill_gap(found_skills,required_skills):

    matched=[]
    missing=[]

    for skill in required_skills:

        if skill in found_skills:
            matched.append(skill)
        else:
            missing.append(skill)

    match_count=len(matched)
    total=len(required_skills)

    return matched,missing,match_count,total