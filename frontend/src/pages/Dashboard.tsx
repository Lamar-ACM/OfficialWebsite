import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'
import type { Event, Announcement, Membership } from '../types'

function formatDate(dt: string) {
  return new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function Dashboard() {
  const { user, refreshUser } = useAuth()
  const qc = useQueryClient()
  const [syncMsg, setSyncMsg] = useState<string | null>(null)

  const syncRoles = useMutation({
    mutationFn: () => api.post<{ synced: string[] }>('/auth/sync-roles').then(r => r.data),
    onSuccess: async (data) => {
      await refreshUser()
      qc.invalidateQueries({ queryKey: ['membership'] })
      if (data.synced.length === 0) {
        setSyncMsg('No changes — your roles are already up to date.')
      } else {
        setSyncMsg(`Synced: ${data.synced.join(', ')} updated from Discord.`)
      }
      setTimeout(() => setSyncMsg(null), 4000)
    },
    onError: () => setSyncMsg('Sync failed. Try again.'),
  })

  const { data: membership } = useQuery<Membership | null>({
    queryKey: ['membership'],
    queryFn: () => api.get('/membership/me').then(r => r.data)
  })
  const { data: events } = useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: () => api.get('/events').then(r => r.data)
  })
  const { data: announcements } = useQuery<Announcement[]>({
    queryKey: ['announcements'],
    queryFn: () => api.get('/announcements').then(r => r.data)
  })

  const myRsvps = events?.filter(e => e.user_has_rsvp && new Date(e.start_time) > new Date()) || []
  const recentAnnouncements = announcements?.slice(0, 5) || []
  const isActiveMember = membership?.status === 'active'

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        {user?.discord_avatar && (
          <div className="relative">
            <img
              src={user.discord_avatar}
              className="w-14 h-14 rounded-full"
              alt="avatar"
            />
            {user?.is_verified && (
              <span className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center ring-2 ring-white">
                <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                </svg>
              </span>
            )}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">Welcome, {user?.discord_username}!</h1>
          <p className="text-gray-500 text-sm">{user?.email}</p>
        </div>
      </div>
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={() => syncRoles.mutate()}
            disabled={syncRoles.isPending}
            className="text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            {syncRoles.isPending ? 'Syncing...' : '↻ Sync Discord Roles'}
          </button>
          {syncMsg && <p className="text-xs text-gray-500">{syncMsg}</p>}
        </div>
      </div>

      {!user?.is_verified && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 mb-6 flex items-center justify-between">
          <div>
            <p className="font-semibold text-yellow-800">Verify your account</p>
            <p className="text-yellow-700 text-sm mt-0.5">Complete a quick CAPTCHA to get your Verified Discord role.</p>
          </div>
          <Link to="/verify" className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ml-4">
            Verify Now →
          </Link>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {isActiveMember ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-semibold text-green-800 text-lg">Active Member</h2>
                  <p className="text-green-700 text-sm mt-1">
                    Membership valid until {membership?.end_date ? formatDate(membership.end_date) : '—'}
                  </p>
                  <p className="text-green-600 text-sm mt-1">Your Discord &quot;Member&quot; role is active.</p>
                </div>
                <span className="text-3xl">✓</span>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <h2 className="font-semibold text-red-800 text-lg">No Active Membership</h2>
              <p className="text-red-700 text-sm mt-1 mb-4">
                Purchase a membership to access member-only events, announcements, and your Discord role.
              </p>
              <Link
                to="/membership"
                className="bg-primary hover:bg-[#8B0000] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-block"
              >
                Get Membership →
              </Link>
            </div>
          )}

          <div>
            <h2 className="text-lg font-semibold mb-4">My Upcoming Events</h2>
            {myRsvps.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-6 text-gray-500 text-sm">
                No upcoming RSVPs.{' '}
                <Link to="/events" className="text-primary hover:underline">Browse events →</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {myRsvps.map(event => (
                  <Link
                    key={event.id}
                    to={`/events/${event.id}`}
                    className="block bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-gray-500">
                          {formatDate(event.start_time)}{event.location ? ` · ${event.location}` : ''}
                        </p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Going</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold mb-3">Quick Links</h3>
            <div className="space-y-2 text-sm">
              <Link to="/events" className="block text-primary hover:underline">Browse Events</Link>
              <Link to="/announcements" className="block text-primary hover:underline">Announcements</Link>
              <Link to="/tickets/new" className="block text-primary hover:underline">Submit Support Ticket</Link>
              <Link to="/tickets" className="block text-primary hover:underline">My Tickets</Link>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold mb-3">Recent Announcements</h3>
            {recentAnnouncements.length === 0 ? (
              <p className="text-sm text-gray-500">None yet.</p>
            ) : (
              <div className="space-y-3">
                {recentAnnouncements.map(ann => (
                  <Link key={ann.id} to={`/announcements/${ann.id}`} className="block">
                    <p className="text-sm font-medium hover:text-primary">{ann.title}</p>
                    <p className="text-xs text-gray-400">{formatDate(ann.created_at)}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
