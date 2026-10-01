import logging
import resend
from app.core.config import settings

logger = logging.getLogger(__name__)

FROM_EMAIL = "Lamar ACM <noreply@lamaracm.org>"


def _send(to: str, subject: str, html: str) -> bool:
    if not settings.RESEND_API_KEY:
        logger.warning(f"RESEND_API_KEY not set — skipping email to {to}")
        return False
    try:
        resend.api_key = settings.RESEND_API_KEY
        resend.Emails.send({"from": FROM_EMAIL, "to": to, "subject": subject, "html": html})
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to}: {e}")
        return False


def send_welcome_email(to: str, username: str) -> bool:
    html = (
        f"<h1>Welcome to Lamar ACM, {username}!</h1>"
        "<p>Your account has been created. Purchase your membership to unlock member benefits.</p>"
    )
    return _send(to, "Welcome to Lamar ACM!", html)


def send_membership_confirmation(to: str, username: str, end_date: str) -> bool:
    html = (
        f"<h1>Membership Confirmed!</h1>"
        f"<p>Hi {username}, your Lamar ACM membership is active until <strong>{end_date}</strong>.</p>"
        "<p>Your Discord Member role has been assigned automatically.</p>"
    )
    return _send(to, "Lamar ACM Membership Confirmed", html)


def send_ticket_opened(to: str, username: str, subject: str, ticket_id: str) -> bool:
    html = (
        f"<h1>Support Ticket Opened</h1>"
        f"<p>Hi {username}, ticket <strong>#{ticket_id[:8]}</strong> has been received.</p>"
        f"<p><strong>Subject:</strong> {subject}</p>"
        "<p>We'll get back to you shortly.</p>"
    )
    return _send(to, f"Ticket Received: {subject}", html)


def send_ticket_reply(to: str, username: str, subject: str, reply: str, ticket_id: str) -> bool:
    html = (
        f"<h1>New Reply on Your Ticket</h1>"
        f"<p>Hi {username}, new reply on ticket <strong>#{ticket_id[:8]}: {subject}</strong></p>"
        f"<blockquote>{reply}</blockquote>"
        "<p>Log in to continue the conversation.</p>"
    )
    return _send(to, f"Ticket Update: {subject}", html)


def send_membership_renewal_reminder(to: str, username: str, days_left: int, end_date: str) -> bool:
    html = (
        f"<h1>Membership Expiring Soon</h1>"
        f"<p>Hi {username}, your membership expires in <strong>{days_left} days</strong> ({end_date}).</p>"
        "<p>Renew now to keep your member benefits and Discord role.</p>"
    )
    return _send(to, f"ACM Membership Expires in {days_left} Days", html)
