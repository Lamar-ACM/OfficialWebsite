from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, field_validator


def _strip_tz(v: datetime) -> datetime:
    return v.replace(tzinfo=None) if v.tzinfo else v


class EventCreate(BaseModel):
    title: str
    description: str
    location: Optional[str] = None
    start_time: datetime
    end_time: datetime
    is_member_only: bool = False
    capacity: Optional[int] = None

    @field_validator('start_time', 'end_time', mode='after')
    @classmethod
    def strip_timezone(cls, v: datetime) -> datetime:
        return _strip_tz(v)


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    is_member_only: Optional[bool] = None
    capacity: Optional[int] = None

    @field_validator('start_time', 'end_time', mode='after')
    @classmethod
    def strip_timezone(cls, v: Optional[datetime]) -> Optional[datetime]:
        return _strip_tz(v) if v else v


class EventResponse(BaseModel):
    id: str
    title: str
    description: str
    location: Optional[str]
    start_time: datetime
    end_time: datetime
    is_member_only: bool
    capacity: Optional[int]
    created_by: str
    created_at: datetime
    rsvp_count: int = 0
    user_has_rsvp: bool = False

    class Config:
        from_attributes = True
