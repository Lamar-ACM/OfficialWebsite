import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'
import type { Event } from '../types'

function formatDate(dt: string) {
  return new Date(dt).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
  })
}

export default function EventDetail() {
  const { id } = useParams<{ id: string }>()
  const { isAuthenticated } = useAuth()
  const qc = useQueryClient()

  const { data: event, isLoading, error } = useQuery<Event>({
    queryKey: ['event', id],
    queryFn: () => api.get(`/events/${id}`).then(r => r.data)
  })

  const rsvp = useMutation({
    mutationFn: () => api.post(`/events/${id}/rsvp`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['event', id] })
  })

  const cancelRsvp = useMutation({
    mutationFn: () => api.delete(`/events/${id}/rsvp`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['event', id] })
  })

  if (isLoading) return <div className="max-w-3xl mx-auto px-4 py-12 text-gray-500">Loading...</div>
  if (error) return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-gray-500">
      Event not found. <Link to="/events" className="text-primary">Back to events</Link>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <Link to="/events" className="text-primary hover:underline text-sm mb-6 inline-block">← Back to events</Link>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-3xl font-bold leading-tight">{event?.title}</h1>
          {event?.is_member_only && (
            <span className="bg-red-50 text-primary text-sm px-3 py-1 rounded-full ml-4 shrink-0">Members only</span>
          )}
        </div>
        <div className="text-gray-600 space-y-1 mb-6 text-sm">
          <p>Starts: {event && formatDate(event.start_time)}</p>
          <p>Ends: {event && formatDate(event.end_time)}</p>
          {event?.location && <p>Location: {event.location}</p>}
          <p>{event?.rsvp_count} attending{event?.capacity ? ` / ${event.capacity} capacity` : ''}</p>
        </div>
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{event?.description}</p>
        <div className="mt-8">
          {isAuthenticated ? (
            event?.user_has_rsvp ? (
              <button
                onClick={() => cancelRsvp.mutate()}
                disabled={cancelRsvp.isPending}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {cancelRsvp.isPending ? 'Cancelling...' : '✓ Cancel RSVP'}
              </button>
            ) : (
              <button
                onClick={() => rsvp.mutate()}
                disabled={rsvp.isPending}
                className="bg-primary hover:bg-[#8B0000] text-white font-medium px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {rsvp.isPending ? 'RSVPing...' : 'RSVP to this event'}
              </button>
            )
          ) : (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link> to RSVP for this event.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
