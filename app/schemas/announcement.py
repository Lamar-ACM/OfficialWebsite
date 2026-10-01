from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class AnnouncementCreate(BaseModel):
    title: str
    body: str
    is_public: bool = False


class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None
    is_public: Optional[bool] = None


class AnnouncementResponse(BaseModel):
    id: str
    title: str
    body: str
    is_public: bool
    created_by: str
    created_at: datetime

    class Config:
        from_attributes = True
