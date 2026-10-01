import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import { useState } from 'react'
import api from '../lib/api'

export default function TicketNew() {
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const qc = useQueryClient()

  const create = useMutation({
    mutationFn: () => api.post('/tickets', { subject, description }).then(r => r.data),
    onSuccess: (ticket: { id: string }) => {
      qc.invalidateQueries({ queryKey: ['my-tickets'] })
      navigate(`/tickets/${ticket.id}`)
    },
    onError: () => setError('Failed to submit ticket. Please try again.')
  })

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <Link to="/tickets" className="text-primary hover:underline text-sm mb-6 inline-block">← Back to Tickets</Link>
      <h1 className="text-3xl font-bold mb-8">New Support Ticket</h1>
      <div className="bg-white border border-gray-200 rounded-xl p-8">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Membership not showing after payment"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={5}
              placeholder="Describe your issue in detail..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            onClick={() => create.mutate()}
            disabled={!subject.trim() || !description.trim() || create.isPending}
            className="w-full bg-primary hover:bg-[#8B0000] disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            {create.isPending ? 'Submitting...' : 'Submit Ticket'}
          </button>
        </div>
      </div>
    </div>
  )
}
