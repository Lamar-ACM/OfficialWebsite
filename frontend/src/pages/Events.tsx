import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import api from '../lib/api'
import type { Event } from '../types'

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales: { 'en-US': enUS },
})

function formatDate(dt: string) {
  return new Date(dt).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
  })
}

export default function Events() {
  const navigate = useNavigate()
  const [view, setView] = useState<'calendar' | 'list'>('calendar')

  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: () => api.get('/events').then(r => r.data)
  })

  const calendarEvents = events?.map(e => ({
    id: e.id,
    title: e.title,
    start: new Date(e.start_time),
    end: new Date(e.end_time),
    resource: e,
  })) ?? []

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Events</h1>
        <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setView('calendar')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'calendar' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Calendar
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'list' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            List
          </button>
        </div>
      </div>

      {isLoading && <div className="text-gray-500">Loading events...</div>}

      {view === 'calendar' ? (
        <div className="bg-white border border-gray-200 rounded-xl p-4" style={{ height: 620 }}>
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            onSelectEvent={(e) => navigate(`/events/${e.id}`)}
            eventPropGetter={(e) => ({
              style: {
                backgroundColor: e.resource.is_member_only ? '#8B1A1A' : '#991b1b',
                borderRadius: '4px',
                border: 'none',
                color: 'white',
                fontSize: '0.78rem',
              }
            })}
            style={{ height: '100%' }}
          />
        </div>
      ) : (
        <>
          {!isLoading && events?.length === 0 && (
            <div className="text-gray-500">No events scheduled.</div>
          )}
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
        </>
      )}
    </div>
  )
}
