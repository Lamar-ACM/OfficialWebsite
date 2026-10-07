import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import auth, membership, events, announcements, tickets, admin, challenges

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.DISCORD_BOT_TOKEN:
        from app.services.discord_bot import start_bot
        asyncio.create_task(start_bot())
    yield


app = FastAPI(title="Lamar ACM API", version="1.0.0", lifespan=lifespan)

_origins = {settings.FRONTEND_URL, "https://lamaracm.org", "https://www.lamaracm.org", "https://lamaracm.netlify.app"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(membership.router)
app.include_router(events.router)
app.include_router(announcements.router)
app.include_router(tickets.router)
app.include_router(admin.router)
app.include_router(challenges.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
