import uuid
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.core.deps import require_admin, get_current_user
from app.core.config import settings
from app.models.user import User
from app.models.membership import Membership
from app.models.ticket import Ticket
from app.models.event import Event
from app.models.announcement import Announcement
from pydantic import BaseModel
from app.schemas.admin import StatsResponse, MemberListItem, MembershipOverride, UserAdminResponse


class EmailBlastRequest(BaseModel):
    subject: str
    body: str
    audience: str = "all"  # "all" | "members" | "non_members"

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/stats", response_model=StatsResponse)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin)
):
    active_members = await db.execute(select(func.count()).where(Membership.status == "active"))
    total_members = await db.execute(select(func.count()).select_from(User))
    open_tickets = await db.execute(select(func.count()).where(Ticket.status == "open"))
    in_progress_tickets = await db.execute(select(func.count()).where(Ticket.status == "in_progress"))
    upcoming_events = await db.execute(select(func.count()).where(Event.start_time > datetime.utcnow()))
    total_announcements = await db.execute(select(func.count()).select_from(Announcement))
    return StatsResponse(
        active_members=active_members.scalar() or 0,
        total_members=total_members.scalar() or 0,
        open_tickets=open_tickets.scalar() or 0,
        in_progress_tickets=in_progress_tickets.scalar() or 0,
        upcoming_events=upcoming_events.scalar() or 0,
        total_announcements=total_announcements.scalar() or 0,
    )

@router.get("/users", response_model=List[UserAdminResponse])
async def list_users(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()
    responses = []
    for user in users:
        mem_result = await db.execute(select(Membership).where(Membership.user_id == user.id))
        membership = mem_result.scalar_one_or_none()
        responses.append(UserAdminResponse(
            id=user.id, discord_id=user.discord_id, discord_username=user.discord_username,
            discord_avatar=user.discord_avatar, email=user.email, role=user.role,
            created_at=user.created_at, is_active=user.is_active,
            membership_status=membership.status if membership else None,
        ))
    return responses


@router.patch("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    role = data.get("role")
    if role not in ("member", "admin"):
        raise HTTPException(status_code=400, detail="Invalid role")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot change your own role")
    user.role = role
    await db.commit()
    return {"message": f"User role updated to {role}"}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await db.delete(user)
    await db.commit()
    return {"message": "User deleted"}


@router.patch("/users/{user_id}/deactivate")
async def deactivate_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = False
    await db.commit()
    return {"message": "User deactivated"}


@router.get("/members", response_model=List[MemberListItem])
async def list_members(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin)
):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()
    items = []
    for user in users:
        membership_result = await db.execute(select(Membership).where(Membership.user_id == user.id))
        membership = membership_result.scalar_one_or_none()
        items.append(MemberListItem(
            id=user.id,
            discord_id=user.discord_id,
            discord_username=user.discord_username,
            email=user.email,
            role=user.role,
            is_active=user.is_active,
            membership_status=membership.status if membership else None,
            membership_end_date=membership.end_date if membership else None,
        ))
    return items

@router.get("/discord-debug")
async def discord_debug(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    import httpx as _httpx
    from app.services.discord_bot import DISCORD_API, _bot_headers

    out = {
        "env": {
            "DISCORD_BOT_TOKEN": ("set, ends in ..." + settings.DISCORD_BOT_TOKEN[-6:]) if settings.DISCORD_BOT_TOKEN else "MISSING",
            "DISCORD_GUILD_ID": settings.DISCORD_GUILD_ID or "MISSING",
            "DISCORD_MEMBER_ROLE_ID": settings.DISCORD_MEMBER_ROLE_ID or "MISSING",
        }
    }

    async with _httpx.AsyncClient() as client:
        # Bot identity
        me = await client.get(f"{DISCORD_API}/users/@me", headers=_bot_headers())
        out["bot_identity"] = me.json() if me.status_code == 200 else {"error": me.status_code, "detail": me.text}

        # Guild + role check + hierarchy check
        guild_resp = await client.get(f"{DISCORD_API}/guilds/{settings.DISCORD_GUILD_ID}", headers=_bot_headers())
        if guild_resp.status_code == 200:
            guild_data = guild_resp.json()
            out["guild"] = {"name": guild_data.get("name")}
            roles = guild_data.get("roles", [])
            match = next((r for r in roles if str(r["id"]) == str(settings.DISCORD_MEMBER_ROLE_ID)), None)
            out["member_role"] = {"found": bool(match), "name": match["name"] if match else None, "position": match["position"] if match else None}

            # Bot's own role positions to check hierarchy
            if me.status_code == 200:
                bot_id = me.json().get("id")
                bot_member = await client.get(f"{DISCORD_API}/guilds/{settings.DISCORD_GUILD_ID}/members/{bot_id}", headers=_bot_headers())
                if bot_member.status_code == 200:
                    bot_role_ids = [str(x) for x in bot_member.json().get("roles", [])]
                    bot_roles = [r for r in roles if str(r["id"]) in bot_role_ids]
                    bot_max_pos = max((r["position"] for r in bot_roles), default=0)
                    member_pos = match["position"] if match else None
                    out["bot_hierarchy"] = {
                        "bot_highest_role_position": bot_max_pos,
                        "member_role_position": member_pos,
                        "hierarchy_ok": (bot_max_pos > member_pos) if member_pos is not None else False,
                    }
        else:
            out["guild"] = {"error": guild_resp.status_code, "detail": guild_resp.text}

        # Live test: try assigning to one active member right now
        test_result = await db.execute(
            select(User).join(Membership, Membership.user_id == User.id).where(
                Membership.status == "active", User.is_active == True
            ).limit(1)
        )
        test_user = test_result.scalar_one_or_none()
        if test_user:
            url = f"{DISCORD_API}/guilds/{settings.DISCORD_GUILD_ID}/members/{test_user.discord_id}/roles/{settings.DISCORD_MEMBER_ROLE_ID}"
            assign_resp = await client.put(url, headers=_bot_headers())
            out["live_assign_test"] = {
                "user": test_user.discord_username,
                "status": assign_resp.status_code,
                "response": assign_resp.text or "OK (no body = success)",
            }

    return out


@router.post("/sync-discord-roles")
async def sync_discord_roles(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    import httpx as _httpx
    from app.services.discord_bot import DISCORD_API, _bot_headers

    result = await db.execute(
        select(User).join(Membership, Membership.user_id == User.id).where(
            Membership.status == "active",
            User.is_active == True,
        )
    )
    members = result.scalars().all()

    assigned = 0
    failures = []
    async with _httpx.AsyncClient() as client:
        for user in members:
            url = f"{DISCORD_API}/guilds/{settings.DISCORD_GUILD_ID}/members/{user.discord_id}/roles/{settings.DISCORD_MEMBER_ROLE_ID}"
            resp = await client.put(url, headers=_bot_headers())
            if resp.status_code in (200, 204):
                assigned += 1
            else:
                failures.append({
                    "user": user.discord_username,
                    "discord_id": user.discord_id,
                    "status": resp.status_code,
                    "detail": resp.text,
                })

    return {
        "assigned": assigned,
        "failed": len(failures),
        "total": len(members),
        "failures": failures,
    }


@router.post("/email-blast")
async def send_email_blast(
    data: EmailBlastRequest,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(select(User).where(User.is_active == True, User.email != None))
    users = result.scalars().all()

    if data.audience == "members":
        member_ids_result = await db.execute(
            select(Membership.user_id).where(Membership.status == "active")
        )
        member_ids = {r for r in member_ids_result.scalars().all()}
        users = [u for u in users if u.id in member_ids]
    elif data.audience == "non_members":
        member_ids_result = await db.execute(
            select(Membership.user_id).where(Membership.status == "active")
        )
        member_ids = {r for r in member_ids_result.scalars().all()}
        users = [u for u in users if u.id not in member_ids]

    from app.services.email_service import send_blast
    sent = 0
    for user in users:
        if user.email:
            if send_blast(user.email, user.discord_username, data.subject, data.body):
                sent += 1

    return {"sent": sent, "total": len(users)}


@router.patch("/users/{user_id}/membership", response_model=MemberListItem)
async def override_membership(
    user_id: str,
    data: MembershipOverride,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin)
):
    if data.status not in ("active", "expired"):
        raise HTTPException(status_code=400, detail="Status must be 'active' or 'expired'")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    membership_result = await db.execute(select(Membership).where(Membership.user_id == user_id))
    membership = membership_result.scalar_one_or_none()
    if not membership:
        membership = Membership(
            id=str(uuid.uuid4()),
            user_id=user_id,
            status=data.status,
            start_date=datetime.utcnow() if data.status == "active" else None,
            end_date=datetime.utcnow() + timedelta(days=365) if data.status == "active" else None,
        )
        db.add(membership)
    else:
        membership.status = data.status
        if data.status == "active" and not membership.start_date:
            membership.start_date = datetime.utcnow()
            membership.end_date = datetime.utcnow() + timedelta(days=365)
    await db.commit()

    if data.status == "active":
        try:
            from app.services.discord_bot import assign_member_role
            await assign_member_role(user.discord_id)
        except Exception:
            pass
    elif data.status == "expired":
        try:
            from app.services.discord_bot import remove_member_role
            await remove_member_role(user.discord_id)
        except Exception:
            pass

    return MemberListItem(
        id=user.id,
        discord_id=user.discord_id,
        discord_username=user.discord_username,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        membership_status=membership.status,
        membership_end_date=membership.end_date,
    )


@router.patch("/users/{user_id}/reactivate")
async def reactivate_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = True
    await db.commit()
    return {"message": "User reactivated"}


@router.delete("/users/{user_id}/membership")
async def remove_membership(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    membership_result = await db.execute(select(Membership).where(Membership.user_id == user_id))
    membership = membership_result.scalar_one_or_none()
    if membership:
        membership.status = "expired"
        await db.commit()

    from app.services.discord_bot import remove_member_role
    await remove_member_role(user.discord_id)

    return {"message": "Membership removed"}
