import logging
from typing import Optional
import stripe
from app.core.config import settings

logger = logging.getLogger(__name__)


async def create_checkout_session(user_id: str, customer_id: Optional[str], email: Optional[str]) -> dict:
    stripe.api_key = settings.STRIPE_SECRET_KEY
    customer = customer_id
    if not customer and email:
        customers = stripe.Customer.list(email=email, limit=1)
        if customers.data:
            customer = customers.data[0].id
        else:
            new_customer = stripe.Customer.create(email=email, metadata={"user_id": user_id})
            customer = new_customer.id

    session_params = {
        "mode": "payment",
        "line_items": [{"price": settings.STRIPE_PRICE_ID, "quantity": 1}],
        "success_url": f"{settings.FRONTEND_URL}/membership/success?session_id={{CHECKOUT_SESSION_ID}}",
        "cancel_url": f"{settings.FRONTEND_URL}/membership",
        "metadata": {"user_id": user_id},
    }
    if customer:
        session_params["customer"] = customer

    session = stripe.checkout.Session.create(**session_params)
    return {"checkout_url": session.url, "customer_id": customer}


def verify_webhook(payload: bytes, signature: str) -> dict:
    stripe.api_key = settings.STRIPE_SECRET_KEY
    return stripe.Webhook.construct_event(payload, signature, settings.STRIPE_WEBHOOK_SECRET)
