import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'
import type { Event, Announcement } from '../types'

function formatDate(dt: string) {
  return new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function Home() {
  const { login, isAuthenticated } = useAuth()
  const { data: events } = useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: () => api.get('/events').then(r => r.data)
  })
  const { data: announcements } = useQuery<Announcement[]>({
    queryKey: ['announcements'],
    queryFn: () => api.get('/announcements').then(r => r.data)
  })

  const upcoming = events?.filter(e => new Date(e.start_time) > new Date()).slice(0, 3) || []
  const recent = announcements?.slice(0, 3) || []

  return (
    <div>
      {/* Hero */}
      <section className="bg-primary text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Welcome to Lamar ACM</h1>
          <p className="text-lg sm:text-xl text-red-100 mb-8">
            Connecting computing students at Lamar University through workshops, competitions, and community.
          </p>
          {!isAuthenticated ? (
            <button
              onClick={login}
              className="bg-white text-primary font-semibold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors text-lg"
            >
              Join with Discord
            </button>
          ) : (
            <Link
              to="/dashboard"
              className="bg-white text-primary font-semibold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors text-lg inline-block"
            >
              Go to Dashboard
            </Link>
          )}
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Upcoming Events</h2>
          <Link to="/events" className="text-primary hover:underline text-sm font-medium">View all →</Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="text-gray-500">No upcoming events scheduled.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcoming.map(event => (
              <Link
                key={event.id}
                to={`/events/${event.id}`}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-lg leading-tight">{event.title}</h3>
                  {event.is_member_only && (
                    <span className="bg-red-50 text-primary text-xs px-2 py-1 rounded-full ml-2 shrink-0">Members</span>
                  )}
                </div>
                <p className="text-gray-500 text-sm mb-4 line-clamp-2">{event.description}</p>
                <div className="text-sm text-gray-600">
                  <p>{formatDate(event.start_time)}</p>
                  {event.location && <p className="text-gray-400">{event.location}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recent Announcements */}
      <section className="bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">Announcements</h2>
            <Link to="/announcements" className="text-primary hover:underline text-sm font-medium">View all →</Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-gray-500">No announcements yet.</p>
          ) : (
            <div className="space-y-4">
              {recent.map(ann => (
                <Link
                  key={ann.id}
                  to={`/announcements/${ann.id}`}
                  className="block bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold">{ann.title}</h3>
                    <span className="text-gray-400 text-sm ml-4 shrink-0">{formatDate(ann.created_at)}</span>
                  </div>
                  <p className="text-gray-600 text-sm mt-2 line-clamp-2">{ann.body}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
