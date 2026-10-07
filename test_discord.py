import asyncio
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

TOKEN = os.getenv("DISCORD_BOT_TOKEN")
GUILD_ID = os.getenv("DISCORD_GUILD_ID")
ROLE_ID = os.getenv("DISCORD_MEMBER_ROLE_ID")
API = "https://discord.com/api/v10"
headers = {"Authorization": f"Bot {TOKEN}"}


async def test():
    async with httpx.AsyncClient() as c:
        # 1. Bot identity
        r = await c.get(f"{API}/users/@me", headers=headers)
        print("Bot identity:", r.status_code, r.text[:300])

        # 2. Guild
        r = await c.get(f"{API}/guilds/{GUILD_ID}", headers=headers)
        print("Guild:", r.status_code, r.text[:300])

        if r.status_code == 200:
            roles = r.json().get("roles", [])
            match = next((ro for ro in roles if str(ro["id"]) == str(ROLE_ID)), None)
            print("Role match:", match)
        else:
            print("Cannot check roles — guild fetch failed")

        # 3. Try assigning role to yourself (put your own discord ID here to test)
        # test_user_id = "YOUR_DISCORD_ID"
        # r = await c.put(f"{API}/guilds/{GUILD_ID}/members/{test_user_id}/roles/{ROLE_ID}", headers=headers)
        # print("Assign role test:", r.status_code, r.text)

asyncio.run(test())
