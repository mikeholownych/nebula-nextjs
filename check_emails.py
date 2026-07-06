import imaplib
import email
from email.header import decode_header

import os

def check_emails():
    mail = imaplib.IMAP4_SSL('imap.agentmail.to')
    mail.login(os.getenv('EMAIL_USER'), os.getenv('EMAIL_PASS'))
    mail.select('inbox')

    status, messages = mail.search(None, 'UNSEEN')
    email_ids = messages[0].split()

    for email_id in email_ids:
        status, msg_data = mail.fetch(email_id, '(RFC822)')
        for response_part in msg_data:
            if isinstance(response_part, tuple):
                msg = email.message_from_bytes(response_part[1])
                subject, encoding = decode_header(msg['Subject'])[0]
                if subject and encoding:
                    subject = subject.decode(encoding)
                if 'Re: $97 audit offer' in subject:
                    sender = msg.get('From')
                    send_audit_request_form(sender)

    mail.logout()

def send_audit_request_form(sender):
    # Implement sending the audit request form
    print(f'Sent audit request form to {sender}')

if __name__ == '__main__':
    check_emails()