import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Text, DateTime, Boolean, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Event(Base):
    __tablename__ = "events"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    location: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    is_member_only: Mapped[bool] = mapped_column(Boolean, default=False)
    capacity: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_by: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    rsvps: Mapped[List["EventRSVP"]] = relationship("EventRSVP", back_populates="event")


class EventRSVP(Base):
    __tablename__ = "event_rsvps"
    __table_args__ = (UniqueConstraint("event_id", "user_id"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id: Mapped[str] = mapped_column(String, ForeignKey("events.id"), nullable=False)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    registered_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    event: Mapped["Event"] = relationship("Event", back_populates="rsvps")
    user: Mapped["User"] = relationship("User", back_populates="rsvps")
