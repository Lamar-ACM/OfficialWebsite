from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


class TicketCreate(BaseModel):
    subject: str
    description: str


class TicketMessageCreate(BaseModel):
    message: str


class TicketStatusUpdate(BaseModel):
    status: str


class TicketMessageResponse(BaseModel):
    id: str
    ticket_id: str
    sender_id: str
    message: str
    sent_at: datetime

    class Config:
        from_attributes = True


class TicketResponse(BaseModel):
    id: str
    user_id: str
    subject: str
    description: str
    status: str
    created_at: datetime
    message_count: int = 0

    class Config:
        from_attributes = True
