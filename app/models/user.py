import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Boolean, DateTime, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    discord_id: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    discord_username: Mapped[str] = mapped_column(String, nullable=False)
    discord_avatar: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    role: Mapped[str] = mapped_column(SAEnum("member", "admin", name="user_role"), default="member")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)

    membership: Mapped[Optional["Membership"]] = relationship("Membership", back_populates="user", uselist=False)
    tickets: Mapped[List["Ticket"]] = relationship("Ticket", back_populates="user")
    rsvps: Mapped[List["EventRSVP"]] = relationship("EventRSVP", back_populates="user")
    challenge_submissions: Mapped[List["ChallengeSubmission"]] = relationship(
        "ChallengeSubmission", foreign_keys="ChallengeSubmission.user_id", back_populates="user"
    )
