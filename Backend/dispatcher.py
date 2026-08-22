import smtplib
from email.message import EmailMessage
from config import SENDER_EMAIL, GMAIL_SMTP_APP_PASSWORD
from logger import logger

def send_cold_email(
    to_email: str,
    subject: str,
    body: str,
    dry_run: bool = True,
    sender_email: str = SENDER_EMAIL,
    app_password: str = GMAIL_SMTP_APP_PASSWORD
) -> bool:
    """
    Sends a cold outreach email using Gmail SMTP over SSL (port 465).
    If dry_run is True, logs the outreach attempt without opening SMTP connections.
    """
    if not to_email:
        logger.warning("Recipient email address is missing. Skipping email dispatch.")
        return False

    if dry_run:
        logger.info(f"[DRY RUN] Email dispatch simulated:\n  To: {to_email}\n  Subject: {subject}\n  Body Snippet: {body[:100]}...")
        return True

    if not sender_email or not app_password:
        logger.error("Cannot send email: SENDER_EMAIL or GMAIL_SMTP_APP_PASSWORD is missing in configuration.")
        return False

    try:
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = sender_email
        msg["To"] = to_email
        msg.set_content(body)

        logger.info(f"Connecting to Gmail SMTP (port 465) to send email to '{to_email}'...")
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=15) as server:
            server.login(sender_email, app_password)
            server.send_message(msg)

        logger.info(f"Successfully sent email to '{to_email}'.")
        return True

    except Exception as e:
        logger.error(f"Failed to send email to '{to_email}': {e}")
        return False
