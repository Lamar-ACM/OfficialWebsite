from urllib.parse import urlencode
import httpx
from app.core.config import settings

DISCORD_API = "https://discord.com/api/v10"
DISCORD_OAUTH_URL = "https://discord.com/api/oauth2/authorize"
DISCORD_TOKEN_URL = "https://discord.com/api/oauth2/token"


def get_oauth_url() -> str:
    params = {
        "client_id": settings.DISCORD_CLIENT_ID,
        "redirect_uri": f"{settings.BACKEND_URL}/auth/discord/callback",
        "response_type": "code",
        "scope": "identify email",
    }
    return f"{DISCORD_OAUTH_URL}?{urlencode(params)}"


async def exchange_code(code: str) -> dict:
    async with httpx.AsyncClient() as client:
        r = await client.post(
            DISCORD_TOKEN_URL,
            data={
                "client_id": settings.DISCORD_CLIENT_ID,
                "client_secret": settings.DISCORD_CLIENT_SECRET,
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": f"{settings.BACKEND_URL}/auth/discord/callback",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        return r.json()


async def get_discord_user(access_token: str) -> dict:
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"{DISCORD_API}/users/@me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        return r.json()
