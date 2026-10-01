from typing import Optional
from pydantic import BaseModel


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: str
    discord_id: str
    discord_username: str
    discord_avatar: Optional[str]
    email: Optional[str]
    role: str
    is_active: bool

    class Config:
        from_attributes = True
