import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import type { Event } from '../types'

function formatDate(dt: string) {
  return new Date(dt).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
  })
}

export default function Events() {
  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: () => api.get('/events').then(r => r.data)
  })

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Events</h1>
      {isLoading && <div className="text-gray-500">Loading events...</div>}
      {!isLoading && events?.length === 0 && <div className="text-gray-500">No events scheduled.</div>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {events?.map(event => (
          <Link
            key={event.id}
            to={`/events/${event.id}`}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow flex flex-col"
          >
            <div className="flex justify-between items-start mb-3">
              <h2 className="font-semibold text-lg leading-tight">{event.title}</h2>
              {event.is_member_only && (
                <span className="bg-red-50 text-primary text-xs px-2 py-1 rounded-full ml-2 shrink-0">Members only</span>
              )}
            </div>
            <p className="text-gray-500 text-sm mb-4 flex-1 line-clamp-3">{event.description}</p>
            <div className="text-sm text-gray-600 space-y-1">
              <p>{formatDate(event.start_time)}</p>
              {event.location && <p className="text-gray-400">{event.location}</p>}
              <p className="text-gray-400">
                {event.rsvp_count} attending{event.capacity ? ` / ${event.capacity}` : ''}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
