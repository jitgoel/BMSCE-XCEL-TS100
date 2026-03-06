import spacy

nlp=spacy.load("en_core_web_sm")

def analyze_bullets(text):

    action_verbs=[
        "developed","built","designed","implemented",
        "optimized","engineered","created","led"
    ]

    sentences=text.split("\n")

    strong=0

    for s in sentences:

        doc=nlp(s.lower())

        for token in doc:
            if token.lemma_ in action_verbs:
                strong+=1
                break

    score=min(strong*10,100)

    return score,strong