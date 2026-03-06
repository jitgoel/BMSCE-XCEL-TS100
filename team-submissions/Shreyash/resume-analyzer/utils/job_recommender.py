def recommend_jobs(found_skills):

    job_roles={

        "Data Scientist":[
            "python","pandas","numpy","machine learning","sql","tensorflow"
        ],

        "Machine Learning Engineer":[
            "python","pytorch","tensorflow","machine learning","docker"
        ],

        "Data Analyst":[
            "python","sql","pandas","tableau","powerbi"
        ],

        "Backend Developer":[
            "python","java","api","docker","sql"
        ],

        "DevOps Engineer":[
            "docker","kubernetes","linux","aws"
        ],

        "AI Engineer":[
            "python","machine learning","deep learning","tensorflow","pytorch"
        ]
    }

    recommendations=[]

    for role in job_roles:

        required=job_roles[role]

        overlap=len(set(found_skills).intersection(required))

        if overlap>=2:
            recommendations.append(role)

    return recommendations