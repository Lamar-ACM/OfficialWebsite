from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class MembershipResponse(BaseModel):
    id: str
    user_id: str
    status: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CheckoutResponse(BaseModel):
    checkout_url: str
