import smtplib

def send_alert():
    sender_email = "mike@example.com"
    receiver_email = "mike@example.com"
    message = "Tunnel health check alert: blog.nebulacomponents.shop is down"

    with smtplib.SMTP('localhost') as server:
        server.sendmail(sender_email, receiver_email, message)

send_alert()