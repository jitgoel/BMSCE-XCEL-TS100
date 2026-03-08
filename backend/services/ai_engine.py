import os
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate

# Load API key directly if needed, or rely on environment variables
os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY", "")

# Initialize the OpenAI LLM through LangChain
# Note: In a real environment we would handle exceptions if the key missing
try:
    llm = ChatOpenAI(temperature=0.7, model_name="gpt-3.5-turbo")
except Exception as e:
    llm = None
    print(f"Failed to initialize LLM: {e}")

class AIEngine:
    @staticmethod
    def parse_resume(resume_text):
        """
        Uses LangChain to extract structured data from raw resume text.
        Returns a JSON string (skills, experience, education).
        """
        prompt = PromptTemplate(
            input_variables=["text"],
            template="Extract the skills, experience, and education from the following resume text. Output as JSON:\n\n{text}"
        )
        if llm:
            chain = prompt | llm
            return chain.invoke({"text": resume_text}).content
        return '{"error": "LLM not initialized"}'

    @staticmethod
    def generate_cover_letter(resume_text, job_description):
        """
        Generates a tailored cover letter.
        """
        prompt = PromptTemplate(
            input_variables=["resume", "job"],
            template=(
                "You are an expert career coach. Based on the following resume:\n"
                "{resume}\n\nAnd the following job description:\n{job}\n\n"
                "Write a highly professional, engaging, and tailored cover letter."
            )
        )
        if llm:
            chain = prompt | llm
            return chain.invoke({"resume": resume_text, "job": job_description}).content
        return "Cover letter generation requires a valid OpenAI API key."

    @staticmethod
    def optimize_bullets(bullet_points):
        """
        Improves phrasing of resume bullets using action verbs and metrics.
        """
        prompt = PromptTemplate(
            input_variables=["bullets"],
            template="Optimize the following resume bullet points using strong action verbs and imply quantifiable metrics where appropriate:\n\n{bullets}"
        )
        if llm:
            chain = prompt | llm
            return chain.invoke({"bullets": bullet_points}).content
        return "Optimization requires a valid OpenAI API key."
