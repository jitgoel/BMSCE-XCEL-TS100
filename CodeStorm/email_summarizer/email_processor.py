from ai_models import summarize_email, detect_spam, detect_meeting, priority_score


def analyze_emails(email_list):

    processed = []

    for mail in email_list:

        body = mail["body"]

        summary = summarize_email(body)

        spam = detect_spam(body)

        meeting = detect_meeting(body)

        priority = priority_score(body)

        processed.append(
            {
                "subject": mail["subject"],
                "sender": mail["sender"],
                "summary": summary,
                "spam": spam,
                "meeting_type": meeting,
                "priority": priority
            }
        )

    return processed