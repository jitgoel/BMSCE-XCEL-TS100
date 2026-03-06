"""
Module: llm_summarizer
Description: Wraps the call to the Google Gemini API to extract
structured meeting data (decisions and action items) from a transcript.
"""

import os
import textwrap
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini API
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def summarize_with_llama(transcript):
    """Call Google Gemini to extract structured JSON from a transcript.

    Args:
        transcript (str): Cleaned transcript text.

    Returns:
        str: Raw model output (expected to contain a JSON object).
    """
    prompt = textwrap.dedent(f"""
    You are an expert meeting assistant. Your task is to extract key decisions and action items from a meeting transcript.
    The output MUST be a valid JSON object and nothing else. Do not include markdown code fences or any other text.

    ### Instructions ###
    1. **Decisions**: Identify all key decisions made.
    2. **Action Items**: Identify all tasks that need to be completed. For each task, extract:
        - `Summary`: A concise description of the task.
        - `Assignee`: The person responsible for the task.
        - `Priority`: Assign a priority (Highest, High, Medium, Low or Lowest).
        - `Due date`: The due date for the task, if mentioned. If not, use "N/A". The duedate must be of the format "yyyy-MM-dd".

    ### Example JSON Output ###
    {{
      "decisions": [
        "Decision 1: The team will switch to a new project management tool.",
        "Decision 2: The budget for Q3 marketing campaigns will be increased by 15%."
      ],
      "action_items": [
        {{
          "Summary": "Research and evaluate new project management tools.",
          "Assignee": "Sarah",
          "Priority": "Highest",
          "Due date": "2025-09-01"
        }},
        {{
          "Summary": "Update the Q3 marketing budget proposal.",
          "Assignee": "Alex",
          "Priority": "Medium",
          "Due date": "N/A"
        }}
      ]
    }}

    ### Transcript ###
    {transcript}
    """)

    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return None
