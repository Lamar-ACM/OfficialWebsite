import uuid
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Header

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.config import settings
from app.models.user import User
from app.models.membership import Membership
from app.schemas.membership import MembershipResponse, CheckoutResponse
from app.services import square_service

router = APIRouter(prefix="/membership", tags=["membership"])


@router.get("/me", response_model=Optional[MembershipResponse])
async def get_my_membership(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Membership).where(Membership.user_id == current_user.id))
    return result.scalar_one_or_none()


@router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Membership).where(Membership.user_id == current_user.id))
    existing = result.scalar_one_or_none()
    if existing and existing.status == "active":
        raise HTTPException(status_code=400, detail="Already an active member")

    if not settings.SQUARE_ACCESS_TOKEN or not settings.SQUARE_LOCATION_ID:
        raise HTTPException(status_code=503, detail="Payment system not configured")

    # Create a pending membership record so we have an ID to reference
    if not existing:
        existing = Membership(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            status="pending",
        )
        db.add(existing)
        await db.commit()
        await db.refresh(existing)

    try:
        data = await square_service.create_checkout(
            membership_id=existing.id,
            user_email=current_user.email,
            success_url=f"{settings.FRONTEND_URL}/membership/success",
        )
        existing.square_order_id = data["order_id"]
        await db.commit()
        return CheckoutResponse(checkout_url=data["checkout_url"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/webhook")
async def square_webhook(
    request: Request,
    x_square_hmacsha256_signature: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    if not settings.SQUARE_WEBHOOK_SIGNATURE_KEY:
        raise HTTPException(status_code=503, detail="Webhook not configured")

    payload = await request.body()
    notification_url = f"{settings.BACKEND_URL}/membership/webhook"

    if not square_service.verify_webhook(payload, x_square_hmacsha256_signature or "", notification_url):
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    import json
    import logging
    logger = logging.getLogger(__name__)

    event = json.loads(payload)
    event_type = event.get("type", "")
    logger.info(f"Square webhook received: type={event_type}")

    if event_type in ("payment.created", "payment.updated"):
        payment = event.get("data", {}).get("object", {}).get("payment", {})
        payment_status = payment.get("status")
        logger.info(f"Square webhook payment status={payment_status}")
        if payment_status != "COMPLETED":
            return {"received": True}
        order_id = payment.get("order_id")
        logger.info(f"Square webhook order_id={order_id}")

        if order_id:
            result = await db.execute(
                select(Membership).where(Membership.square_order_id == order_id)
            )
            membership = result.scalar_one_or_none()

            if membership:
                membership.status = "active"
                membership.start_date = datetime.utcnow()
                membership.end_date = datetime.utcnow() + timedelta(days=365)
                await db.commit()

                user_result = await db.execute(select(User).where(User.id == membership.user_id))
                user = user_result.scalar_one_or_none()
                if user:
                    try:
                        from app.services.discord_bot import assign_member_role
                        await assign_member_role(user.discord_id)
                    except Exception:
                        pass

                    if user.email:
                        try:
                            from app.services.email_service import send_membership_confirmation
                            send_membership_confirmation(
                                user.email, user.discord_username,
                                membership.end_date.strftime("%B %d, %Y"),
                            )
                        except Exception:
                            pass

    return {"received": True}
