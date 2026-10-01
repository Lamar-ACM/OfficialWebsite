import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import api from '../../lib/api'
import type { Ticket } from '../../types'

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  closed: 'bg-gray-100 text-gray-600'
}

export default function AdminTickets() {
  const [filter, setFilter] = useState<string>('all')

  const { data: tickets, isLoading } = useQuery<Ticket[]>({
    queryKey: ['admin-tickets'],
    queryFn: () => api.get('/tickets').then(r => r.data)
  })

  const filtered = tickets?.filter(t => filter === 'all' || t.status === filter) || []

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Support Tickets</h2>
      <div className="flex gap-2 mb-4">
        {['all', 'open', 'in_progress', 'closed'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`text-sm px-3 py-1 rounded-lg transition-colors ${filter === s ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {s === 'all' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>
      {isLoading && <div className="text-gray-500">Loading...</div>}
      <div className="space-y-2">
        {filtered.map(ticket => (
          <Link key={ticket.id} to={`/admin/tickets/${ticket.id}`}
            className="block bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{ticket.subject}</p>
                <p className="text-sm text-gray-500 truncate">{ticket.description}</p>
              </div>
              <div className="flex flex-col items-end gap-1 ml-4 shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[ticket.status]}`}>
                  {ticket.status.replace('_', ' ')}
                </span>
                <span className="text-xs text-gray-400">{ticket.message_count} msgs</span>
              </div>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && !isLoading && <div className="text-gray-500 text-sm">No tickets.</div>}
      </div>
    </div>
  )
}
