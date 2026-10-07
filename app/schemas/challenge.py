from datetime import datetime
from typing import Optional
from pydantic import BaseModel

CHALLENGES = [
    {"id": 1, "title": "Portfolio Website", "description": "Build & deploy a portfolio showcasing real projects with live demos/repos."},
    {"id": 2, "title": "Build an API", "description": "Create a REST API, microservice, or data pipeline."},
    {"id": 3, "title": "Build a Full Stack Web App", "description": "Frontend + backend + deployed."},
    {"id": 4, "title": "Solve 20 LeetCode Problems", "description": "Screenshot or profile link showing 20+ solved problems."},
    {"id": 5, "title": "Optimize Existing Code", "description": "Refactor a project for performance and document the improvements."},
    {"id": 6, "title": "Go to a Hackathon", "description": "Participate in any hackathon — any placement counts."},
    {"id": 7, "title": "Get 5 GitHub Stars", "description": "Launch or maintain an open source project and earn 5 GitHub stars."},
]

CHALLENGES_REQUIRED = 4


class ChallengeItem(BaseModel):
    id: int
    title: str
    description: str
    submission: Optional["SubmissionResponse"] = None


class SubmissionResponse(BaseModel):
    id: str
    challenge_id: int
    proof_url: str
    note: Optional[str]
    status: str
    submitted_at: datetime
    reviewed_at: Optional[datetime]
    reviewer_notes: Optional[str]

    class Config:
        from_attributes = True


class ChallengesResponse(BaseModel):
    challenges: list[ChallengeItem]
    approved_count: int
    required: int
    membership_granted: bool


class SubmitProofRequest(BaseModel):
    proof_url: str
    note: Optional[str] = None


class AdminSubmissionResponse(BaseModel):
    id: str
    challenge_id: int
    challenge_title: str
    proof_url: str
    note: Optional[str]
    status: str
    submitted_at: datetime
    reviewed_at: Optional[datetime]
    reviewer_notes: Optional[str]
    user_id: str
    discord_username: str
    discord_avatar: Optional[str]

    class Config:
        from_attributes = True


class ReviewRequest(BaseModel):
    status: str  # "approved" or "rejected"
    reviewer_notes: Optional[str] = None


ChallengeItem.model_rebuild()
