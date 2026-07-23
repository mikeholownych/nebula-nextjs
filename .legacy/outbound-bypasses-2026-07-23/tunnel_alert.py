import smtplib
from email.mime.text import MIMEText

def send_alert():
    msg = MIMEText('Cloudflare tunnel is down while local endpoint is up.')
    msg['Subject'] = 'Tunnel Alert'
    msg['From'] = 'tunnel_monitor@example.com'
    msg['To'] = 'admin@example.com'

    with smtplib.SMTP('smtp.gmail.com', 587) as server:
        server.starttls()
        server.login('username', 'password')
        server.send_message(msg)

send_alert()