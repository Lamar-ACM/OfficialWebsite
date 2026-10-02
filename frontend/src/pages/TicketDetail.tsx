import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'
import type { Ticket, TicketMessage } from '../types'

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  closed: 'bg-gray-100 text-gray-600'
}

function formatTime(dt: string) {
  return new Date(dt).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
  })
}

export default function TicketDetail() {
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
    }
  })

  const deleteTicket = useMutation({
    mutationFn: () => api.delete(`/tickets/${id}`),
    onSuccess: () => navigate('/tickets')
  })

  const deleteMsg = useMutation({
    mutationFn: (msgId: string) => api.delete(`/tickets/${id}/messages/${msgId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ticket-messages', id] })
  })

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <Link to="/tickets" className="text-primary hover:underline text-sm mb-6 inline-block">← Back to Tickets</Link>

      {ticket && (
        <div className="mb-6">
          <div className="flex items-start justify-between">
            <h1 className="text-2xl font-bold leading-tight">{ticket.subject}</h1>
            <div className="flex items-center gap-2 ml-4 shrink-0">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[ticket.status]}`}>
                {ticket.status.replace('_', ' ')}
              </span>
              {(user?.role === 'admin' || ticket.user_id === user?.id) && (
                <button
                  onClick={() => { if (window.confirm('Delete this ticket?')) deleteTicket.mutate() }}
                  className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-lg transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
          <p className="text-gray-600 mt-3 bg-gray-50 rounded-lg p-4 text-sm">{ticket.description}</p>
        </div>
      )}

      <div className="space-y-4 mb-6">
        <h2 className="font-semibold text-gray-700">Messages</h2>
        {messages?.length === 0 && (
          <p className="text-gray-500 text-sm">No messages yet. The team will respond soon.</p>
        )}
        {messages?.map(msg => {
          const isMe = msg.sender_id === user?.id
          const canDelete = isMe || user?.role === 'admin'
          return (
            <div key={msg.id} className={`flex items-end gap-2 group ${isMe ? 'justify-end' : 'justify-start'}`}>
              {isMe && canDelete && (
                <button
                  onClick={() => deleteMsg.mutate(msg.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-opacity text-xs px-1"
                  title="Delete message"
                >
                  ✕
                </button>
              )}
              <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${isMe ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-800'}`}>
                <p>{msg.message}</p>
                <p className={`text-xs mt-1 ${isMe ? 'text-red-200' : 'text-gray-400'}`}>{formatTime(msg.sent_at)}</p>
              </div>
              {!isMe && canDelete && (
                <button
                  onClick={() => deleteMsg.mutate(msg.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-opacity text-xs px-1"
                  title="Delete message"
                >
                  ✕
                </button>
              )}
            </div>
          )
        })}
      </div>

      {ticket?.status !== 'closed' ? (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={3}
            placeholder="Type a message..."
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary resize-none mb-3"
          />
          <div className="flex justify-end">
            <button
              onClick={() => send.mutate()}
              disabled={!message.trim() || send.isPending}
              className="bg-primary hover:bg-[#8B0000] disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {send.isPending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-xl p-4 text-center text-sm text-gray-500">This ticket is closed.</div>
      )}
    </div>
  )
}
