from flask import Flask, jsonify, request
from flask_cors import CORS
from transcriptSummarizer.summarize import summarize_json
from jira_integration import create_jira_issue
import tempfile
import os

app = Flask(__name__)
CORS(app)

def create_jira_issue_from_summary(structured_data):
    """
    Iterates through the action items in the structured data and
    creates a Jira issue for each one.
    """
    if not structured_data or "action_items" not in structured_data:
        print("No action items found in the provided data.")
        return

    action_items = structured_data["action_items"]
    for item in action_items:
        create_jira_issue(item)

# This is the main API endpoint for your project.
@app.route('/analyze-transcript', methods=['POST'])
def analyze_transcript():
    """
    API endpoint to process a meeting transcript and return
    a structured JSON summary.

    The request must be a POST request with the raw transcript text
    in the body.
    """

    # Get the transcript from the request body.
    transcript_text = request.data.decode('utf-8')

    if not transcript_text:
        return jsonify({"error": "No transcript data provided."}), 400
    # Create a temporary file to store the transcript, as your summarize_json function
    # expects a file path. We use 'tempfile' to handle this securely.
    temp_file = None
    try:
        # Create a temporary file that will be automatically cleaned up.
        with tempfile.NamedTemporaryFile(mode='w+', delete=False, encoding='utf-8') as tf:
            tf.write(transcript_text)
            temp_file = tf.name

        # Call your core summarization function with the temporary file path.
        structured_data = summarize_json(temp_file)

        # Handle potential parsing errors.
        if structured_data is None:
            return jsonify({"error": "Failed to parse LLM output into JSON."}), 500

        # Create Jira issues for each action item if present
        create_jira_issue_from_summary(structured_data)

        # Return the structured data as a JSON response.
        return jsonify(structured_data)

    finally:
        # Ensure the temporary file is deleted even if an error occurs.
        if temp_file and os.path.exists(temp_file):
            os.remove(temp_file)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "service": "Curia AI Summarizer"})

if __name__ == '__main__':
    # Run the Flask app on port 5002 (Express runs on 5001)
    app.run(host='0.0.0.0', port=5002, debug=True)
