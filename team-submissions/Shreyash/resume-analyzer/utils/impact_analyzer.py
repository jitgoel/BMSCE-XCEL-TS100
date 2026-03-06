import re

def detect_achievements(text):

    patterns=[
        r"\d+%",
        r"\d+\s?percent",
        r"\d+x",
        r"\d+\s?times",
        r"\d+\s?ms",
        r"\d+\s?seconds",
        r"\d+\s?users",
        r"\d+\s?records"
    ]

    count=0

    for p in patterns:
        matches=re.findall(p,text.lower())
        count+=len(matches)

    score=min(count*20,100)

    return score,count