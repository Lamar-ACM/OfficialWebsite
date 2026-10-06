from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


class UserAdminResponse(BaseModel):
    id: str
    discord_id: str
    discord_username: str
    discord_avatar: Optional[str] = None
    email: Optional[str] = None
    role: str
    created_at: datetime
    is_active: bool
    membership_status: Optional[str] = None

    class Config:
        from_attributes = True


class StatsResponse(BaseModel):
    total_members: int
    active_members: int
    open_tickets: int
    in_progress_tickets: int
    upcoming_events: int
    total_announcements: int


class MemberListItem(BaseModel):
    id: str
    discord_id: str
    discord_username: str
    email: Optional[str] = None
    role: str
    is_active: bool = True
    membership_status: Optional[str] = None
    membership_end_date: Optional[datetime] = None


class MembershipOverride(BaseModel):
    status: str
