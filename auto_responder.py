import time
import imaplib
import email
from email.header import decode_header

def check_inbox_and_respond():
    # Connect to the email server
    mail = imaplib.IMAP4_SSL('imap.agentmail.to', 993)
    mail.login('templates@agentmail.to', 'your_agentmail_api_key')
    mail.select('inbox')

    # Search for unread emails
    status, messages = mail.search(None, 'UNSEEN')
    email_ids = messages[0].split()

    for email_id in email_ids:
        # Fetch the email
        _, msg_data = mail.fetch(email_id, '(RFC822)')
        for response_part in msg_data:
            if isinstance(response_part, tuple):
                msg = email.message_from_bytes(response_part[1])
                subject, encoding = decode_header(msg["subject"])[0]
                if isinstance(subject, bytes):
                    subject = subject.decode(encoding if encoding else "utf-8")

                # Detect interest based on email content
                if "template" in subject.lower() or "template" in msg.get_payload().lower():
                    interest = 'template'
                elif "audit" in subject.lower() or "audit" in msg.get_payload().lower():
                    interest = 'audit'
                elif "both" in subject.lower() or "both" in msg.get_payload().lower():
                    interest = 'both'
                else:
                    interest = 'none'

                # Respond based on detected interest
                if interest == 'template':
                    print('Responding with template download links...')
                    # Log response type
                    print('Logged: Template response')
                elif interest == 'audit':
                    print('Responding with audit details...')
                    # Log response type
                    print('Logged: Audit response')
                elif interest == 'both':
                    print('Offering both template and audit with guidance...')
                    # Log response type
                    print('Logged: Both response')
                else:
                    print('No specific interest detected...')

    # Logout from the email server
    mail.logout()

while True:
    check_inbox_and_respond()
    time.sleep(300)  # Wait for 5 minutes before checking again