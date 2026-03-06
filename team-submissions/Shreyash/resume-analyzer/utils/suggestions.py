import spacy

nlp=spacy.load("en_core_web_sm")

def generate_suggestions(found_skills,missing_skills,text):

    suggestions=[]

    doc=nlp(text)

    if "project" not in text:
        suggestions.append("Add a projects section demonstrating practical technical work")

    if "experience" not in text:
        suggestions.append("Include internship or work experience relevant to the role")

    if "education" not in text:
        suggestions.append("Add an education section with degree and institution")

    if len(missing_skills)>0:
        suggestions.append("Consider adding relevant skills such as: "+", ".join(missing_skills))

    if len(found_skills)<6:
        suggestions.append("Increase the number of technical skills highlighted in the resume")

    action_words=["developed","built","implemented","designed","optimized"]

    action_found=False
    for token in doc:
        if token.text.lower() in action_words:
            action_found=True
            break

    if not action_found:
        suggestions.append("Use stronger action verbs like developed, implemented, or optimized")

    impact_words=["improved","increased","reduced","accuracy","performance","latency","efficiency"]

    impact_found=False
    for token in doc:
        if token.text.lower() in impact_words:
            impact_found=True
            break

    if not impact_found:
        suggestions.append("Add measurable achievements such as accuracy improvements or performance gains")

    word_count=len(text.split())

    if word_count<150:
        suggestions.append("Expand project descriptions with technical details")

    if "docker" in missing_skills or "kubernetes" in missing_skills:
        suggestions.append("Consider adding deployment or containerization technologies")

    if "aws" in missing_skills or "gcp" in missing_skills:
        suggestions.append("Mention cloud platform experience such as AWS or GCP")

    if len(suggestions)==0:
        suggestions.append("Resume quality is strong. Focus on emphasizing measurable project impact")

    return suggestions