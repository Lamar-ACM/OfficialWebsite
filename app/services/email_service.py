import logging
from typing import Optional
import resend
from app.core.config import settings

logger = logging.getLogger(__name__)

FROM_EMAIL = "Lamar ACM <noreply@lamaracm.org>"

def _send(to: str, subject: str, html: str) -> bool:
    if not settings.RESEND_API_KEY:
        logger.warning(f"No RESEND_API_KEY — skipping email to {to}: {subject}")
        return False
    resend.api_key = settings.RESEND_API_KEY
    try:
        resend.Emails.send({"from": FROM_EMAIL, "to": [to], "subject": subject, "html": html})
        return True
    except Exception as e:
        logger.error(f"Email failed to {to}: {e}")
        return False

def send_welcome_email(to_email: str, username: str) -> bool:
    return _send(
        to_email,
        "Welcome to Lamar ACM!",
        f"<h2>Welcome to Lamar ACM, {username}!</h2>"
        "<p>You have successfully signed in. Browse our upcoming events and announcements.</p>"
        "<p>To access member-only content, purchase a membership from your dashboard.</p>"
    )

def send_membership_confirmation(to_email: str, username: str, end_date: str) -> bool:
    return _send(
        to_email,
        "Your Lamar ACM Membership is Active!",
        f"<h2>Membership Confirmed, {username}!</h2>"
        f"<p>Your membership is now active until <strong>{end_date}</strong>.</p>"
        "<p>You now have access to all member-only events and announcements.</p>"
        "<p>Check your Discord server — your Member role has been assigned.</p>"
    )

def send_ticket_opened(to_email: str, username: str, subject: str, ticket_id: str) -> bool:
    return _send(
        to_email,
        f"Support Ticket Opened: {subject}",
        f"<h2>Hi {username},</h2>"
        "<p>Your support ticket has been received:</p>"
        f"<p><strong>{subject}</strong></p>"
        f"<p>Ticket ID: <code>{ticket_id}</code></p>"
        "<p>Our team will respond shortly.</p>"
    )

def send_ticket_reply(to_email: str, username: str, subject: str, reply: str) -> bool:
    return _send(
        to_email,
        f"New Reply on Your Ticket: {subject}",
        f"<h2>Hi {username},</h2>"
        f"<p>Your ticket <strong>{subject}</strong> has a new reply:</p>"
        f"<blockquote>{reply}</blockquote>"
        "<p>Log in to continue the conversation.</p>"
    )

def send_blast(to_email: str, username: str, subject: str, body: str) -> bool:
    html = (
        f"<h2>Hi {username},</h2>"
        f"<div style='white-space:pre-wrap'>{body}</div>"
        "<br><p style='color:#888;font-size:12px'>You received this because you are a Lamar ACM member. "
        "Log in at lamaracm.org to manage your account.</p>"
    )
    return _send(to_email, subject, html)


def send_renewal_reminder(to_email: str, username: str, end_date: str) -> bool:
    return _send(
        to_email,
        "Your Lamar ACM Membership Expires Soon",
        f"<h2>Hi {username},</h2>"
        f"<p>Your Lamar ACM membership expires on <strong>{end_date}</strong>.</p>"
        "<p>Renew now to keep your Discord role and access to member-only content.</p>"
    )
