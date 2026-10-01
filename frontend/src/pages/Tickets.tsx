import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import type { Ticket } from '../types'

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  closed: 'bg-gray-100 text-gray-600'
}

export default function Tickets() {
  const { data: tickets, isLoading } = useQuery<Ticket[]>({
    queryKey: ['my-tickets'],
    queryFn: () => api.get('/tickets').then(r => r.data)
  })

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Support Tickets</h1>
        <Link
          to="/tickets/new"
          className="bg-primary hover:bg-[#8B0000] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          New Ticket
        </Link>
      </div>
      {isLoading && <div className="text-gray-500">Loading...</div>}
      {!isLoading && tickets?.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <p className="mb-4">No tickets yet.</p>
          <Link to="/tickets/new" className="text-primary hover:underline">Submit your first ticket</Link>
        </div>
      )}
      <div className="space-y-3">
        {tickets?.map(ticket => (
          <Link
            key={ticket.id}
            to={`/tickets/${ticket.id}`}
            className="block bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{ticket.subject}</p>
                <p className="text-sm text-gray-500 mt-1 truncate">{ticket.description}</p>
              </div>
              <div className="flex flex-col items-end gap-2 ml-4 shrink-0">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[ticket.status]}`}>
                  {ticket.status.replace('_', ' ')}
                </span>
                <span className="text-xs text-gray-400">{ticket.message_count} messages</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
