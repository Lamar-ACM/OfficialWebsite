import uuid
from urllib.parse import urlencode
import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.user import UserResponse, TokenResponse

router = APIRouter(tags=["auth"])

DISCORD_API_BASE = "https://discord.com/api/v10"


@router.get("/auth/discord")
async def discord_login():
    params = {
        "client_id": settings.DISCORD_CLIENT_ID,
        "redirect_uri": f"{settings.BACKEND_URL}/auth/discord/callback",
        "response_type": "code",
        "scope": "identify email",
    }
    return RedirectResponse(url=f"https://discord.com/api/oauth2/authorize?{urlencode(params)}")


@router.get("/auth/discord/callback")
async def discord_callback(
    code: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            f"{DISCORD_API_BASE}/oauth2/token",
            data={
                "client_id": settings.DISCORD_CLIENT_ID,
                "client_secret": settings.DISCORD_CLIENT_SECRET,
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": f"{settings.BACKEND_URL}/auth/discord/callback",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        if token_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange Discord code")
        discord_token = token_resp.json()["access_token"]

        user_resp = await client.get(
            f"{DISCORD_API_BASE}/users/@me",
            headers={"Authorization": f"Bearer {discord_token}"},
        )
        if user_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get Discord user")
        discord_user = user_resp.json()

    discord_id = discord_user["id"]
    username = discord_user.get("username", "")
    avatar = discord_user.get("avatar")
    email = discord_user.get("email")
    avatar_url = f"https://cdn.discordapp.com/avatars/{discord_id}/{avatar}.png" if avatar else None

    result = await db.execute(select(User).where(User.discord_id == discord_id))
    user = result.scalar_one_or_none()
    is_new = user is None

    if user is None:
        user = User(
            id=str(uuid.uuid4()),
            discord_id=discord_id,
            discord_username=username,
            discord_avatar=avatar_url,
            email=email,
        )
        db.add(user)
    else:
        user.discord_username = username
        user.discord_avatar = avatar_url
        if email:
            user.email = email

    await db.commit()
    await db.refresh(user)

    if is_new and user.email:
        from app.services.email_service import send_welcome_email
        send_welcome_email(user.email, user.discord_username)

    # Sync verified role from Discord
    if settings.DISCORD_BOT_TOKEN and settings.DISCORD_VERIFIED_ROLE_ID:
        try:
            from app.services.discord_bot import has_verified_role
            if await has_verified_role(user.discord_id) and not user.is_verified:
                user.is_verified = True
                await db.commit()
                await db.refresh(user)
        except Exception:
            pass

    access_token = create_access_token({"sub": user.id, "role": user.role})
    refresh_token = create_refresh_token({"sub": user.id})
    params = urlencode({"access_token": access_token, "refresh_token": refresh_token})
    return RedirectResponse(url=f"{settings.FRONTEND_URL}/auth/callback?{params}")


@router.post("/auth/refresh", response_model=TokenResponse)
async def refresh_token_endpoint(
    refresh_token: str,
    db: AsyncSession = Depends(get_db),
):
    try:
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user_id = payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found")

    new_access = create_access_token({"sub": user.id, "role": user.role})
    new_refresh = create_refresh_token({"sub": user.id})
    return TokenResponse(
        access_token=new_access,
        refresh_token=new_refresh,
        user=UserResponse.model_validate(user),
    )


@router.get("/users/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/auth/verify")
async def verify_user(
    token: str = Body(..., embed=True),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.is_verified:
        return {"verified": True}

    # Validate Turnstile token
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            data={
                "secret": settings.TURNSTILE_SECRET_KEY,
                "response": token,
            },
        )
        result = resp.json()

    if not result.get("success"):
        raise HTTPException(status_code=400, detail="CAPTCHA verification failed")

    current_user.is_verified = True
    await db.commit()

    # Assign Discord verified role
    if settings.DISCORD_BOT_TOKEN and settings.DISCORD_VERIFIED_ROLE_ID:
        try:
            from app.services.discord_bot import assign_verified_role
            await assign_verified_role(current_user.discord_id)
        except Exception:
            pass

    return {"verified": True}


@router.post("/auth/logout")
async def logout():
    return {"message": "Logged out"}
