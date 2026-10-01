from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class UserResponse(BaseModel):
    id: str
    discord_id: str
    discord_username: str
    discord_avatar: Optional[str] = None
    email: Optional[str] = None
    role: str
    created_at: datetime
    is_active: bool

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse
