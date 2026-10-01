from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///./test.db"
    DISCORD_CLIENT_ID: str = ""
    DISCORD_CLIENT_SECRET: str = ""
    DISCORD_BOT_TOKEN: str = ""
    DISCORD_GUILD_ID: str = ""
    DISCORD_MEMBER_ROLE_ID: str = ""
    DISCORD_VERIFIED_ROLE_ID: str = "1195942905144160406"
    TURNSTILE_SECRET_KEY: str = ""
    SQUARE_ACCESS_TOKEN: str = ""
    SQUARE_LOCATION_ID: str = ""
    SQUARE_WEBHOOK_SIGNATURE_KEY: str = ""
    SQUARE_ENVIRONMENT: str = "sandbox"
    MEMBERSHIP_PRICE_CENTS: int = 2000
    RESEND_API_KEY: str = ""
    JWT_SECRET_KEY: str = "dev-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_URL: str = "http://localhost:8000"

    class Config:
        env_file = ".env"


settings = Settings()
