import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../lib/api'
import type { Ticket, TicketMessage } from '../../types'

const statusOptions = ['open', 'in_progress', 'closed'] as const

function formatTime(dt: string) {
  return new Date(dt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function AdminTicketDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const qc = useQueryClient()

  const { data: ticket } = useQuery<Ticket>({
    queryKey: ['ticket', id],
    queryFn: () => api.get(`/tickets/${id}`).then(r => r.data)
  })
  const { data: messages } = useQuery<TicketMessage[]>({
    queryKey: ['ticket-messages', id],
    queryFn: () => api.get(`/tickets/${id}/messages`).then(r => r.data)
  })

  const send = useMutation({
    mutationFn: () => api.post(`/tickets/${id}/messages`, { message }).then(r => r.data),
    onSuccess: () => {
      setMessage('')
      qc.invalidateQueries({ queryKey: ['ticket-messages', id] })
      qc.invalidateQueries({ queryKey: ['ticket', id] })
      qc.invalidateQueries({ queryKey: ['admin-tickets'] })
    }
  })

  const deleteTicket = useMutation({
    mutationFn: () => api.delete(`/tickets/${id}`),
    onSuccess: () => navigate('/admin/tickets')
  })

  const updateStatus = useMutation({
    mutationFn: (status: string) => api.patch(`/tickets/${id}/status`, { status }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ticket', id] })
      qc.invalidateQueries({ queryKey: ['admin-tickets'] })
    }
  })

  return (
    <div>
      <Link to="/admin/tickets" className="text-primary hover:underline text-sm mb-4 inline-block">← Back to Tickets</Link>

      {ticket && (
        <div className="mb-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">{ticket.subject}</h2>
              <p className="text-sm text-gray-500">Ticket ID: {ticket.id.slice(0, 8)}...</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map(s => (
                <button key={s} onClick={() => updateStatus.mutate(s)}
                  className={`text-xs px-3 py-1 rounded-lg transition-colors ${ticket.status === s ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {s.replace('_', ' ')}
                </button>
              ))}
              <button
                onClick={() => { if (window.confirm('Delete this ticket?')) deleteTicket.mutate() }}
                className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
          <p className="text-gray-600 mt-3 bg-gray-50 rounded-lg p-4 text-sm">{ticket.description}</p>
        </div>
      )}

      <div className="space-y-4 mb-6">
        {messages?.length === 0 && <p className="text-gray-500 text-sm">No messages yet.</p>}
        {messages?.map(msg => {
          const isAdmin = msg.sender_id === user?.id
          return (
            <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${isAdmin ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-800'}`}>
                {!isAdmin && <p className="text-xs font-medium mb-1 text-gray-500">User</p>}
                <p>{msg.message}</p>
                <p className={`text-xs mt-1 ${isAdmin ? 'text-red-200' : 'text-gray-400'}`}>{formatTime(msg.sent_at)}</p>
              </div>
            </div>
          )
        })}
      </div>

      {ticket?.status !== 'closed' && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} placeholder="Reply to user..."
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary resize-none mb-3" />
          <div className="flex justify-end">
            <button onClick={() => send.mutate()} disabled={!message.trim() || send.isPending}
              className="bg-primary hover:bg-[#8B0000] disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              {send.isPending ? 'Sending...' : 'Send Reply'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
