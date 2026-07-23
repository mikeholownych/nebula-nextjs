import os
import time
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def check_inbox():
    print("Checking inbox for new messages.")
    # Simulate inbox check (replace with actual logic)
    new_messages = [
        {"from": "user1@example.com", "subject": "Interested in $7 template", "body": "I'm interested in the $7 template."},
        {"from": "user2@example.com", "subject": "Interested in $97 audit", "body": "I'm interested in the $97 audit."},
        {"from": "user3@example.com", "body": "I'm interested in both the $7 template and the $97 audit."}
    ]
    
    for message in new_messages:
        subject = message.get('subject', '')
        body = message.get('body', '')
        if "Interested in $7 template" in subject or "Interested in $7 template" in body:
            send_response(message["from"], "Here are the download links for the $7 template.")
        elif "Interested in $97 audit" in subject or "Interested in $97 audit" in body:
            send_response(message["from"], "Here are the details for the $97 audit.")
        else:
            send_response(message["from"], "Here are the download links for the $7 template and the details for the $97 audit. Start with the template.")
    
    print("Inbox check complete.")

def send_response(to_email, body):
    sender_email = "nebulashop@agentmail.to"
    with open("/home/mike/.hermes/secrets/agentmail.key", 'r') as f:
        sender_password = f.read().strip()
    
    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = to_email
    msg['Subject'] = "Your Response"
    msg.attach(MIMEText(body, 'plain'))
    
    try:
        server = smtplib.SMTP('smtp.agentmail.to', 587)
        server.starttls()
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, to_email, msg.as_string())
        server.quit()
        print(f"Response sent to {to_email}")
    except Exception as e:
        print(f"Failed to send response to {to_email}: {e}")

if __name__ == "__main__":
    while True:
        check_inbox()
        time.sleep(300)