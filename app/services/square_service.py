import uuid
import hmac
import hashlib
import base64
from typing import Optional
from square import Square
from square.environment import SquareEnvironment
from app.core.config import settings


def get_client() -> Square:
    env = SquareEnvironment.SANDBOX if settings.SQUARE_ENVIRONMENT == "sandbox" else SquareEnvironment.PRODUCTION
    return Square(token=settings.SQUARE_ACCESS_TOKEN, environment=env)


async def create_checkout(
    membership_id: str,
    user_email: Optional[str],
    success_url: str,
) -> dict:
    client = get_client()

    # quick_pay creates order + hosted payment link in one call
    link_kwargs: dict = {
        "idempotency_key": str(uuid.uuid4()),
        "quick_pay": {
            "name": "Lamar ACM Membership (1 year)",
            "price_money": {
                "amount": settings.MEMBERSHIP_PRICE_CENTS,
                "currency": "USD",
            },
            "location_id": settings.SQUARE_LOCATION_ID,
        },
        "checkout_options": {
            "redirect_url": success_url,
        },
    }
    if user_email:
        link_kwargs["pre_populated_data"] = {"buyer_email": user_email}

    link_response = client.checkout.payment_links.create(**link_kwargs)
    order_id = link_response.payment_link.order_id
    checkout_url = link_response.payment_link.url

    return {"checkout_url": checkout_url, "order_id": order_id}


def verify_webhook(payload: bytes, signature: str, notification_url: str) -> bool:
    combined = notification_url + payload.decode("utf-8")
    digest = hmac.new(
        settings.SQUARE_WEBHOOK_SIGNATURE_KEY.encode("utf-8"),
        combined.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    expected = base64.b64encode(digest).decode("utf-8")
    return hmac.compare_digest(signature, expected)
