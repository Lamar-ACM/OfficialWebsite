import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.core.deps import get_current_user, get_current_user_optional, require_admin, require_active_member
from app.models.event import Event, EventRSVP
from app.models.user import User
from app.schemas.event import EventCreate, EventUpdate, EventResponse

router = APIRouter(prefix="/events", tags=["events"])


async def _build_event_response(event: Event, db: AsyncSession, current_user: Optional[User]) -> EventResponse:
    count_result = await db.execute(select(func.count()).where(EventRSVP.event_id == event.id))
    rsvp_count = count_result.scalar() or 0
    user_has_rsvp = False
    if current_user:
        rsvp_result = await db.execute(
            select(EventRSVP).where(EventRSVP.event_id == event.id, EventRSVP.user_id == current_user.id)
        )
        user_has_rsvp = rsvp_result.scalar_one_or_none() is not None
    return EventResponse(
        id=event.id, title=event.title, description=event.description,
        location=event.location, start_time=event.start_time, end_time=event.end_time,
        is_member_only=event.is_member_only, capacity=event.capacity,
        created_by=event.created_by, created_at=event.created_at,
        rsvp_count=rsvp_count, user_has_rsvp=user_has_rsvp,
    )


@router.get("", response_model=List[EventResponse])
async def list_events(
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    query = select(Event)
    if not current_user:
        query = query.where(Event.is_member_only == False)
    result = await db.execute(query.order_by(Event.start_time))
    events = result.scalars().all()
    return [await _build_event_response(e, db, current_user) for e in events]


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.is_member_only and not current_user:
        raise HTTPException(status_code=403, detail="Members only")
    return await _build_event_response(event, db, current_user)


@router.post("", response_model=EventResponse)
async def create_event(
    data: EventCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    event = Event(id=str(uuid.uuid4()), created_by=current_user.id, **data.model_dump())
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return await _build_event_response(event, db, current_user)


@router.put("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: str,
    data: EventUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(event, field, value)
    await db.commit()
    await db.refresh(event)
    return await _build_event_response(event, db, current_user)


@router.delete("/{event_id}")
async def delete_event(
    event_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    await db.delete(event)
    await db.commit()
    return {"message": "Event deleted"}


@router.post("/{event_id}/rsvp")
async def rsvp_event(
    event_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_active_member),
):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    existing = await db.execute(
        select(EventRSVP).where(EventRSVP.event_id == event_id, EventRSVP.user_id == current_user.id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already RSVPed")
    if event.capacity:
        count = await db.execute(select(func.count()).where(EventRSVP.event_id == event_id))
        if (count.scalar() or 0) >= event.capacity:
            raise HTTPException(status_code=400, detail="Event is full")
    rsvp = EventRSVP(id=str(uuid.uuid4()), event_id=event_id, user_id=current_user.id)
    db.add(rsvp)
    await db.commit()
    return {"message": "RSVP confirmed"}


@router.delete("/{event_id}/rsvp")
async def cancel_rsvp(
    event_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_active_member),
):
    result = await db.execute(
        select(EventRSVP).where(EventRSVP.event_id == event_id, EventRSVP.user_id == current_user.id)
    )
    rsvp = result.scalar_one_or_none()
    if not rsvp:
        raise HTTPException(status_code=404, detail="No RSVP found")
    await db.delete(rsvp)
    await db.commit()
    return {"message": "RSVP cancelled"}
