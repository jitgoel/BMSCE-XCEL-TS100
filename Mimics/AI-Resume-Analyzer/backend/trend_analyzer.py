def analyze_market(skills):

    demand_scores = {
        "python": 95,
        "machine learning": 90,
        "deep learning": 85,
        "react": 80,
        "docker": 75,
        "kubernetes": 70,
        "sql": 88
    }

    result = {}

    for skill in skills:

        result[skill] = demand_scores.get(skill, 50)

    return result