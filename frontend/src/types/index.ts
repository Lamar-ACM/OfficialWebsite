export interface User {
  id: string
  discord_id: string
  discord_username: string
  discord_avatar: string | null
  email: string | null
  role: 'member' | 'admin'
  is_active: boolean
  is_verified: boolean
}

export interface Membership {
  id: string
  status: 'pending' | 'active' | 'expired'
  start_date: string | null
  end_date: string | null
}

export interface Event {
  id: string
  title: string
  description: string
  location: string | null
  start_time: string
  end_time: string
  is_member_only: boolean
  capacity: number | null
  created_by: string
  created_at: string
  rsvp_count: number
  user_has_rsvp: boolean
}

export interface Announcement {
  id: string
  title: string
  body: string
  is_public: boolean
  created_by: string
  created_at: string
}

export interface Ticket {
  id: string
  user_id: string
  subject: string
  description: string
  status: 'open' | 'in_progress' | 'closed'
  created_at: string
  message_count: number
}

export interface TicketMessage {
  id: string
  sender_id: string
  message: string
  sent_at: string
}

export interface AdminStats {
  active_members: number
  total_members: number
  open_tickets: number
  in_progress_tickets: number
  upcoming_events: number
}

export interface ChallengeSubmission {
  id: string
  challenge_id: number
  proof_url: string
  note: string | null
  status: 'pending' | 'approved' | 'rejected'
  submitted_at: string
  reviewed_at: string | null
  reviewer_notes: string | null
}

export interface ChallengeItem {
  id: number
  title: string
  description: string
  submission: ChallengeSubmission | null
}

export interface ChallengesResponse {
  challenges: ChallengeItem[]
  approved_count: number
  required: number
  membership_granted: boolean
}

export interface AdminSubmission {
  id: string
  challenge_id: number
  challenge_title: string
  proof_url: string
  note: string | null
  status: 'pending' | 'approved' | 'rejected'
  submitted_at: string
  reviewed_at: string | null
  reviewer_notes: string | null
  user_id: string
  discord_username: string
  discord_avatar: string | null
}
