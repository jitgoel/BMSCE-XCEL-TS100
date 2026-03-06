import streamlit as st
import pandas as pd

from email_fetcher import fetch_emails
from email_processor import analyze_emails


st.set_page_config(
    page_title="MailMind AI",
    layout="wide"
)

st.title("📧 MailMind – AI Email Assistant")


# Sidebar login

st.sidebar.header("Login to Gmail")

email_id = st.sidebar.text_input("Email")

password = st.sidebar.text_input("App Password", type="password")

fetch_button = st.sidebar.button("Fetch Emails")


if fetch_button:

    with st.spinner("Fetching Emails..."):

        emails = fetch_emails(email_id, password)

    with st.spinner("Running AI Analysis..."):

        analyzed = analyze_emails(emails)

    df = pd.DataFrame(analyzed)

    st.success("Emails analyzed successfully!")

    # Dashboard metrics

    col1, col2, col3 = st.columns(3)

    col1.metric(
        "Total Emails",
        len(df)
    )

    col2.metric(
        "High Priority",
        len(df[df["priority"] == "High"])
    )

    col3.metric(
        "Meetings",
        len(df[df["meeting_type"] == "meeting"])
    )

    st.divider()

    st.subheader("📊 Email Dashboard")

    st.dataframe(df)

    st.divider()

    st.subheader("📨 Email Insights")

    for i, row in df.iterrows():

        with st.expander(f"📌 {row['subject']}"):

            st.write("Sender:", row["sender"])

            st.write("Priority:", row["priority"])

            st.write("Spam Status:", row["spam"])

            st.write("Meeting Detection:", row["meeting_type"])

            st.write("Summary:")

            st.write(row["summary"])

    st.divider()

    st.subheader("🧠 Daily AI Digest")

    digest = ""

    for i in range(min(5, len(df))):

        digest += f"- {df.iloc[i]['summary']}\n\n"

    st.write(digest)