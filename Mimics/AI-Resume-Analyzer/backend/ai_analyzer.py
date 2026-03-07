from google import genai

client = genai.Client(api_key="ADD_API_KEY_HERE")

def analyze_resume(data):

    prompt = f"""
        You are an expert technical recruiter and ATS resume evaluator.

        Analyze the following resume carefully.

        RESUME TEXT:
        {data["text"]}

        EXTRACTED SKILLS:
        {data["skills"]}

        Return a detailed evaluation with the following structure:

        1. Resume Score (0-100)

        2. ATS Compatibility Score (0-100)

        3. Strengths
        - Bullet points explaining what is good.

        4. Weaknesses
        - Bullet points explaining problems.

        5. Grammar / Formatting Issues

        6. Missing Sections
        Examples:
        - LinkedIn profile
        - GitHub links
        - Professional summary
        - Metrics in experience

        7. Resume Improvement Suggestions

        8. Missing Skills Based on Current AI/Software Market

        9. Sentences that should be rewritten (bad sentences)

        10. Good resume lines that stand out

        Be concise and professional.
        """

    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=prompt
    )

    return response.text