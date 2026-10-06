import asyncio
import logging
import httpx
import discord
from app.core.config import settings

logger = logging.getLogger(__name__)

DISCORD_API = "https://discord.com/api/v10"

intents = discord.Intents.default()
intents.members = True
bot = discord.Bot(intents=intents)


@bot.event
async def on_ready():
    logger.info(f"Discord bot ready: {bot.user}")


def _bot_headers() -> dict:
    return {"Authorization": f"Bot {settings.DISCORD_BOT_TOKEN}"}


async def assign_member_role(discord_id: str) -> bool:
    try:
        url = f"{DISCORD_API}/guilds/{settings.DISCORD_GUILD_ID}/members/{discord_id}/roles/{settings.DISCORD_MEMBER_ROLE_ID}"
        async with httpx.AsyncClient() as client:
            resp = await client.put(url, headers=_bot_headers())
        if resp.status_code in (200, 204):
            logger.info(f"Assigned member role to {discord_id}")
            return True
        logger.error(f"assign_member_role {discord_id}: {resp.status_code} {resp.text}")
        return False
    except Exception as e:
        logger.error(f"assign_member_role {discord_id}: {e}")
        return False


async def remove_member_role(discord_id: str) -> bool:
    try:
        url = f"{DISCORD_API}/guilds/{settings.DISCORD_GUILD_ID}/members/{discord_id}/roles/{settings.DISCORD_MEMBER_ROLE_ID}"
        async with httpx.AsyncClient() as client:
            resp = await client.delete(url, headers=_bot_headers())
        if resp.status_code in (200, 204):
            logger.info(f"Removed member role from {discord_id}")
            return True
        logger.error(f"remove_member_role {discord_id}: {resp.status_code} {resp.text}")
        return False
    except Exception as e:
        logger.error(f"remove_member_role {discord_id}: {e}")
        return False


async def has_member_role(discord_id: str) -> bool:
    try:
        url = f"{DISCORD_API}/guilds/{settings.DISCORD_GUILD_ID}/members/{discord_id}"
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, headers=_bot_headers())
        if resp.status_code != 200:
            return False
        roles = resp.json().get("roles", [])
        return str(settings.DISCORD_MEMBER_ROLE_ID) in [str(r) for r in roles]
    except Exception as e:
        logger.error(f"has_member_role {discord_id}: {e}")
        return False


async def assign_verified_role(discord_id: str) -> bool:
    try:
        url = f"{DISCORD_API}/guilds/{settings.DISCORD_GUILD_ID}/members/{discord_id}/roles/{settings.DISCORD_VERIFIED_ROLE_ID}"
        async with httpx.AsyncClient() as client:
            resp = await client.put(url, headers=_bot_headers())
        if resp.status_code in (200, 204):
            logger.info(f"Assigned verified role to {discord_id}")
            return True
        logger.error(f"assign_verified_role {discord_id}: {resp.status_code} {resp.text}")
        return False
    except Exception as e:
        logger.error(f"assign_verified_role {discord_id}: {e}")
        return False


async def has_verified_role(discord_id: str) -> bool:
    try:
        url = f"{DISCORD_API}/guilds/{settings.DISCORD_GUILD_ID}/members/{discord_id}"
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, headers=_bot_headers())
        if resp.status_code != 200:
            return False
        roles = resp.json().get("roles", [])
        return str(settings.DISCORD_VERIFIED_ROLE_ID) in [str(r) for r in roles]
    except Exception as e:
        logger.error(f"has_verified_role {discord_id}: {e}")
        return False


async def start_bot():
    if not settings.DISCORD_BOT_TOKEN:
        logger.warning("No DISCORD_BOT_TOKEN set — bot disabled")
        return
    try:
        await bot.start(settings.DISCORD_BOT_TOKEN)
    except Exception as e:
        logger.error(f"Bot failed to start: {e}")
