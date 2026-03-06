from transformers import pipeline
import random


# Summarization model
summarizer = pipeline(
    "summarization",
    model="facebook/bart-large-cnn"
)

# Spam detection model
spam_classifier = pipeline(
    "text-classification",
    model="mrm8488/bert-tiny-finetuned-sms-spam-detection"
)

# Zero-shot classifier for meeting detection
meeting_detector = pipeline(
    "zero-shot-classification",
    model="facebook/bart-large-mnli"
)


def summarize_email(text):

    if len(text) < 50:
        return text

    result = summarizer(
        text,
        max_length=120,
        min_length=30,
        do_sample=False
    )

    return result[0]["summary_text"]


def detect_spam(text):

    result = spam_classifier(text[:512])[0]

    return result["label"]


def detect_meeting(text):

    candidate_labels = ["meeting", "casual email", "promotion"]

    result = meeting_detector(
        text[:512],
        candidate_labels
    )

    return result["labels"][0]


def priority_score(text):

    keywords = [
        "urgent",
        "asap",
        "deadline",
        "important",
        "meeting",
        "project"
    ]

    score = 0

    for word in keywords:
        if word in text.lower():
            score += 1

    score += random.randint(0, 2)

    if score >= 4:
        return "High"
    elif score >= 2:
        return "Medium"
    else:
        return "Low"