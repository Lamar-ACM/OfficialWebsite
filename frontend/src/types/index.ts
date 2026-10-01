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
