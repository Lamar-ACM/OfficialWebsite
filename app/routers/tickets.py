import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.core.deps import get_current_user, require_admin
from app.models.ticket import Ticket, TicketMessage
from app.models.user import User
from app.schemas.ticket import (
    TicketCreate, TicketMessageCreate, TicketStatusUpdate,
    TicketResponse, TicketMessageResponse
)

router = APIRouter(prefix="/tickets", tags=["tickets"])

VALID_STATUSES = {"open", "in_progress", "closed"}

async def _ticket_response(ticket: Ticket, db: AsyncSession) -> TicketResponse:
    count_result = await db.execute(select(func.count()).where(TicketMessage.ticket_id == ticket.id))
    return TicketResponse(
        id=ticket.id, user_id=ticket.user_id, subject=ticket.subject,
        description=ticket.description, status=ticket.status,
        created_at=ticket.created_at, message_count=count_result.scalar() or 0,
    )

@router.get("", response_model=List[TicketResponse])
async def list_tickets(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "admin":
        result = await db.execute(select(Ticket).order_by(Ticket.created_at.desc()))
    else:
        result = await db.execute(select(Ticket).where(Ticket.user_id == current_user.id).order_by(Ticket.created_at.desc()))
    tickets = result.scalars().all()
    return [await _ticket_response(t, db) for t in tickets]

@router.post("", response_model=TicketResponse)
async def create_ticket(
    data: TicketCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = Ticket(id=str(uuid.uuid4()), user_id=current_user.id, **data.model_dump())
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)
    return await _ticket_response(ticket, db)

@router.get("/{ticket_id}", response_model=TicketResponse)
async def get_ticket(
    ticket_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Ticket).where(Ticket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if current_user.role != "admin" and ticket.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return await _ticket_response(ticket, db)

@router.get("/{ticket_id}/messages", response_model=List[TicketMessageResponse])
async def get_ticket_messages(
    ticket_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Ticket).where(Ticket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if current_user.role != "admin" and ticket.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    msg_result = await db.execute(
        select(TicketMessage).where(TicketMessage.ticket_id == ticket_id).order_by(TicketMessage.sent_at)
    )
    return msg_result.scalars().all()

@router.post("/{ticket_id}/messages", response_model=TicketMessageResponse)
async def add_ticket_message(
    ticket_id: str,
    data: TicketMessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Ticket).where(Ticket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if current_user.role != "admin" and ticket.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    msg = TicketMessage(id=str(uuid.uuid4()), ticket_id=ticket_id, sender_id=current_user.id, message=data.message)
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return msg

@router.patch("/{ticket_id}/status", response_model=TicketResponse)
async def update_ticket_status(
    ticket_id: str,
    data: TicketStatusUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin)
):
    if data.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {VALID_STATUSES}")
    result = await db.execute(select(Ticket).where(Ticket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    ticket.status = data.status
    await db.commit()
    await db.refresh(ticket)
    return await _ticket_response(ticket, db)
