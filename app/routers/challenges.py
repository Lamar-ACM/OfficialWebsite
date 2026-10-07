import uuid
import logging
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.deps import get_current_user, require_admin
from app.models.user import User
from app.models.membership import Membership
from app.models.challenge import ChallengeSubmission
from app.schemas.challenge import (
    CHALLENGES, CHALLENGES_REQUIRED,
    ChallengeItem, ChallengesResponse, SubmissionResponse,
    SubmitProofRequest, AdminSubmissionResponse, ReviewRequest,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/challenges", tags=["challenges"])


@router.get("", response_model=ChallengesResponse)
async def get_challenges(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ChallengeSubmission).where(ChallengeSubmission.user_id == current_user.id)
    )
    submissions = {s.challenge_id: s for s in result.scalars().all()}

    membership_result = await db.execute(
        select(Membership).where(Membership.user_id == current_user.id)
    )
    membership = membership_result.scalar_one_or_none()

    items = []
    for c in CHALLENGES:
        sub = submissions.get(c["id"])
        items.append(ChallengeItem(
            id=c["id"],
            title=c["title"],
            description=c["description"],
            submission=SubmissionResponse.model_validate(sub) if sub else None,
        ))

    approved_count = sum(1 for s in submissions.values() if s.status == "approved")

    return ChallengesResponse(
        challenges=items,
        approved_count=approved_count,
        required=CHALLENGES_REQUIRED,
        membership_granted=membership is not None and membership.status == "active",
    )


@router.post("/{challenge_id}/submit", response_model=SubmissionResponse)
async def submit_challenge(
    challenge_id: int,
    data: SubmitProofRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if challenge_id < 1 or challenge_id > 7:
        raise HTTPException(status_code=400, detail="Invalid challenge ID")

    result = await db.execute(
        select(ChallengeSubmission).where(
            ChallengeSubmission.user_id == current_user.id,
            ChallengeSubmission.challenge_id == challenge_id,
        )
    )
    existing = result.scalar_one_or_none()

    if existing and existing.status == "approved":
        raise HTTPException(status_code=400, detail="Challenge already approved")

    if existing:
        existing.proof_url = data.proof_url
        existing.note = data.note
        existing.status = "pending"
        existing.submitted_at = datetime.utcnow()
        existing.reviewed_at = None
        existing.reviewer_id = None
        existing.reviewer_notes = None
        await db.commit()
        await db.refresh(existing)
        return SubmissionResponse.model_validate(existing)

    submission = ChallengeSubmission(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        challenge_id=challenge_id,
        proof_url=data.proof_url,
        note=data.note,
    )
    db.add(submission)
    await db.commit()
    await db.refresh(submission)
    return SubmissionResponse.model_validate(submission)


@router.get("/admin/submissions", response_model=List[AdminSubmissionResponse])
async def list_submissions(
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    query = select(ChallengeSubmission, User).join(User, User.id == ChallengeSubmission.user_id)
    if status:
        query = query.where(ChallengeSubmission.status == status)
    query = query.order_by(ChallengeSubmission.submitted_at.desc())

    result = await db.execute(query)
    rows = result.all()

    challenge_map = {c["id"]: c["title"] for c in CHALLENGES}
    return [
        AdminSubmissionResponse(
            id=sub.id,
            challenge_id=sub.challenge_id,
            challenge_title=challenge_map.get(sub.challenge_id, f"Challenge {sub.challenge_id}"),
            proof_url=sub.proof_url,
            note=sub.note,
            status=sub.status,
            submitted_at=sub.submitted_at,
            reviewed_at=sub.reviewed_at,
            reviewer_notes=sub.reviewer_notes,
            user_id=user.id,
            discord_username=user.discord_username,
            discord_avatar=user.discord_avatar,
        )
        for sub, user in rows
    ]


@router.patch("/admin/submissions/{submission_id}/review", response_model=AdminSubmissionResponse)
async def review_submission(
    submission_id: str,
    data: ReviewRequest,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    if data.status not in ("approved", "rejected"):
        raise HTTPException(status_code=400, detail="Status must be 'approved' or 'rejected'")

    result = await db.execute(
        select(ChallengeSubmission).where(ChallengeSubmission.id == submission_id)
    )
    submission = result.scalar_one_or_none()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    submission.status = data.status
    submission.reviewed_at = datetime.utcnow()
    submission.reviewer_id = current_admin.id
    submission.reviewer_notes = data.reviewer_notes
    await db.commit()
    await db.refresh(submission)

    if data.status == "approved":
        await _check_and_grant_membership(submission.user_id, db)

    user_result = await db.execute(select(User).where(User.id == submission.user_id))
    user = user_result.scalar_one_or_none()

    challenge_map = {c["id"]: c["title"] for c in CHALLENGES}
    return AdminSubmissionResponse(
        id=submission.id,
        challenge_id=submission.challenge_id,
        challenge_title=challenge_map.get(submission.challenge_id, f"Challenge {submission.challenge_id}"),
        proof_url=submission.proof_url,
        note=submission.note,
        status=submission.status,
        submitted_at=submission.submitted_at,
        reviewed_at=submission.reviewed_at,
        reviewer_notes=submission.reviewer_notes,
        user_id=user.id,
        discord_username=user.discord_username,
        discord_avatar=user.discord_avatar,
    )


async def _check_and_grant_membership(user_id: str, db: AsyncSession):
    count_result = await db.execute(
        select(func.count()).where(
            ChallengeSubmission.user_id == user_id,
            ChallengeSubmission.status == "approved",
        )
    )
    approved_count = count_result.scalar() or 0

    if approved_count < CHALLENGES_REQUIRED:
        return

    membership_result = await db.execute(select(Membership).where(Membership.user_id == user_id))
    membership = membership_result.scalar_one_or_none()

    if membership and membership.status == "active":
        return

    if membership:
        membership.status = "active"
        membership.start_date = datetime.utcnow()
        membership.end_date = datetime.utcnow() + timedelta(days=365)
    else:
        membership = Membership(
            id=str(uuid.uuid4()),
            user_id=user_id,
            status="active",
            start_date=datetime.utcnow(),
            end_date=datetime.utcnow() + timedelta(days=365),
        )
        db.add(membership)

    await db.commit()

    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if user:
        try:
            from app.services.discord_bot import assign_member_role
            await assign_member_role(user.discord_id)
        except Exception as e:
            logger.error(f"Failed to assign Discord role after challenge completion: {e}")
