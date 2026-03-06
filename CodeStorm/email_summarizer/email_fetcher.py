import imaplib
import email
from email.header import decode_header


def fetch_emails(email_id, app_password, limit=15):

    imap = imaplib.IMAP4_SSL("imap.gmail.com")

    imap.login(email_id, app_password)

    imap.select("inbox")

    status, messages = imap.search(None, "ALL")

    mail_ids = messages[0].split()

    email_data = []

    for mail in mail_ids[-limit:]:

        status, msg_data = imap.fetch(mail, "(RFC822)")

        for response in msg_data:

            if isinstance(response, tuple):

                msg = email.message_from_bytes(response[1])

                subject, encoding = decode_header(msg["Subject"])[0]

                if isinstance(subject, bytes):
                    subject = subject.decode(encoding if encoding else "utf-8")

                sender = msg.get("From")

                body = ""

                if msg.is_multipart():

                    for part in msg.walk():

                        content_type = part.get_content_type()

                        if content_type == "text/plain":

                            body = part.get_payload(decode=True).decode(errors="ignore")

                            break
                else:

                    body = msg.get_payload(decode=True).decode(errors="ignore")

                email_data.append(
                    {
                        "subject": subject,
                        "sender": sender,
                        "body": body
                    }
                )

    imap.logout()

    return email_data