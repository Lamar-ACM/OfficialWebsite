import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.deps import get_current_user_optional, require_admin
from app.models.announcement import Announcement
from app.models.user import User
from app.schemas.announcement import AnnouncementCreate, AnnouncementUpdate, AnnouncementResponse

router = APIRouter(prefix="/announcements", tags=["announcements"])


@router.get("", response_model=List[AnnouncementResponse])
async def list_announcements(
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    query = select(Announcement)
    if not current_user:
        query = query.where(Announcement.is_public == True)
    result = await db.execute(query.order_by(Announcement.created_at.desc()))
    return result.scalars().all()


@router.get("/{announcement_id}", response_model=AnnouncementResponse)
async def get_announcement(
    announcement_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    result = await db.execute(select(Announcement).where(Announcement.id == announcement_id))
    ann = result.scalar_one_or_none()
    if not ann:
        raise HTTPException(status_code=404, detail="Not found")
    if not ann.is_public and not current_user:
        raise HTTPException(status_code=403, detail="Members only")
    return ann


@router.post("", response_model=AnnouncementResponse)
async def create_announcement(
    data: AnnouncementCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    ann = Announcement(id=str(uuid.uuid4()), created_by=current_user.id, **data.model_dump())
    db.add(ann)
    await db.commit()
    await db.refresh(ann)
    return ann


@router.put("/{announcement_id}", response_model=AnnouncementResponse)
async def update_announcement(
    announcement_id: str,
    data: AnnouncementUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(select(Announcement).where(Announcement.id == announcement_id))
    ann = result.scalar_one_or_none()
    if not ann:
        raise HTTPException(status_code=404, detail="Not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(ann, field, value)
    await db.commit()
    await db.refresh(ann)
    return ann


@router.delete("/{announcement_id}")
async def delete_announcement(
    announcement_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(select(Announcement).where(Announcement.id == announcement_id))
    ann = result.scalar_one_or_none()
    if not ann:
        raise HTTPException(status_code=404, detail="Not found")
    await db.delete(ann)
    await db.commit()
    return {"message": "Announcement deleted"}
