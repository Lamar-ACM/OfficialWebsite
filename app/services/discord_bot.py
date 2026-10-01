import asyncio
import logging
from typing import Optional
import discord
from app.core.config import settings

logger = logging.getLogger(__name__)

intents = discord.Intents.default()
intents.members = True
bot = discord.Bot(intents=intents)


@bot.event
async def on_ready():
    logger.info(f"Discord bot ready: {bot.user}")


async def assign_member_role(discord_id: str) -> bool:
    try:
        guild = bot.get_guild(int(settings.DISCORD_GUILD_ID))
        if not guild:
            logger.warning("Guild not found")
            return False
        member = guild.get_member(int(discord_id))
        if not member:
            member = await guild.fetch_member(int(discord_id))
        role = guild.get_role(int(settings.DISCORD_MEMBER_ROLE_ID))
        if not role:
            logger.warning("Member role not found")
            return False
        await member.add_roles(role)
        logger.info(f"Assigned member role to {discord_id}")
        return True
    except Exception as e:
        logger.error(f"Failed to assign role to {discord_id}: {e}")
        return False


async def assign_verified_role(discord_id: str) -> bool:
    try:
        guild = bot.get_guild(int(settings.DISCORD_GUILD_ID))
        if not guild:
            return False
        member = guild.get_member(int(discord_id))
        if not member:
            member = await guild.fetch_member(int(discord_id))
        role = guild.get_role(int(settings.DISCORD_VERIFIED_ROLE_ID))
        if not role:
            logger.warning("Verified role not found")
            return False
        await member.add_roles(role)
        logger.info(f"Assigned verified role to {discord_id}")
        return True
    except Exception as e:
        logger.error(f"Failed to assign verified role to {discord_id}: {e}")
        return False


async def has_verified_role(discord_id: str) -> bool:
    try:
        guild = bot.get_guild(int(settings.DISCORD_GUILD_ID))
        if not guild:
            return False
        member = guild.get_member(int(discord_id))
        if not member:
            member = await guild.fetch_member(int(discord_id))
        role_id = int(settings.DISCORD_VERIFIED_ROLE_ID)
        return any(r.id == role_id for r in member.roles)
    except Exception as e:
        logger.error(f"Failed to check verified role for {discord_id}: {e}")
        return False


async def remove_member_role(discord_id: str) -> bool:
    try:
        guild = bot.get_guild(int(settings.DISCORD_GUILD_ID))
        if not guild:
            return False
        member = guild.get_member(int(discord_id))
        if not member:
            member = await guild.fetch_member(int(discord_id))
        role = guild.get_role(int(settings.DISCORD_MEMBER_ROLE_ID))
        if not role:
            return False
        await member.remove_roles(role)
        logger.info(f"Removed member role from {discord_id}")
        return True
    except Exception as e:
        logger.error(f"Failed to remove role from {discord_id}: {e}")
        return False


async def start_bot():
    if not settings.DISCORD_BOT_TOKEN:
        logger.warning("No DISCORD_BOT_TOKEN set — bot disabled")
        return
    try:
        await bot.start(settings.DISCORD_BOT_TOKEN)
    except Exception as e:
        logger.error(f"Bot failed to start: {e}")
