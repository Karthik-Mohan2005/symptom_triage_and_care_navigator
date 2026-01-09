import smtplib
from email.message import EmailMessage

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587

SENDER_EMAIL = "bhuvakarthiklathamohan@gmail.com"
APP_PASSWORD = "ppassword"

def send_critical_email(to_email, body):
    msg = EmailMessage()
    msg["Subject"] = "Reg: Emergency Appointment Confirmation – Pulmonology"
    msg["From"] = SENDER_EMAIL
    msg["To"] = to_email
    msg.set_content(body)

    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
        server.starttls()
        server.login(SENDER_EMAIL, APP_PASSWORD)
        server.send_message(msg)
