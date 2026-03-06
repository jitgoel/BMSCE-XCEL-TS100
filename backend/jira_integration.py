import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

# Replace with your Jira credentials and project info
JIRA_URL = os.getenv("JIRA_URL", "https://zealotsan.atlassian.net")
JIRA_PROJECT_KEY = os.getenv("JIRA_PROJECT_KEY", "AIMEETING")
JIRA_API_TOKEN = os.getenv("JIRA_API_TOKEN")
JIRA_EMAIL = os.getenv("JIRA_EMAIL")

def create_jira_issue(action_item):
    """
    Creates a single Jira issue from an action item dictionary.
    """
    # Use API v3 endpoint which requires a specific description format
    url = f"{JIRA_URL}/rest/api/3/issue"

    # Map the action item fields to Jira issue fields
    # Map LLM output fields to Jira fields
    # LLM outputs: task, owner, priority, deadline
    # Jira expects: summary, description, priority, duedate
    summary = action_item.get("task") or action_item.get("Summary") or "Action Item"
    priority = action_item.get("priority") or action_item.get("Priority") or "Medium"
    deadline = action_item.get("deadline") or action_item.get("Due date")

    payload = json.dumps({
        "fields": {
            "project": {
                "key": JIRA_PROJECT_KEY
            },
            "summary": summary,
            "description": {
              "content": [
                {
                  "content": [
                    {
                      "text": f"Action item identified during a meeting: {summary}",
                      "type": "text"
                    }
                  ],
                  "type": "paragraph"
                }
              ],
              "type": "doc",
              "version": 1
            },
            "issuetype": {
                "name": "Task"  # Or another issue type like 'Story' or 'Bug'
            },
            "priority": {
                "name": priority
            },
            **({"duedate": deadline} if deadline and deadline != "N/A" else {})
        }
    })

    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json"
    }

    try:
        response = requests.request(
            "POST",
            url,
            data=payload,
            headers=headers,
            auth=(JIRA_EMAIL, JIRA_API_TOKEN)
        )
        response.raise_for_status() # Raise an HTTPError for bad responses (4xx or 5xx)
        print(f"Successfully created Jira issue: {response.json().get('key')}")
        return True
    except requests.exceptions.HTTPError as err:
        print(f"Failed to create Jira issue. Error: {err}")
        print(f"Response content: {err.response.text}")
        return False