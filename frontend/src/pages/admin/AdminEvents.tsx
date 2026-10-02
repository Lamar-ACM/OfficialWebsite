import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import api from '../../lib/api'
import type { Event } from '../../types'

interface EventForm {
  title: string; description: string; location: string
  start_time: string; end_time: string; is_member_only: boolean; capacity: string
}

const emptyForm: EventForm = {
  title: '', description: '', location: '',
  start_time: '', end_time: '', is_member_only: false, capacity: ''
}

function toDatetimeLocal(iso: string) {
  return iso ? iso.slice(0, 16) : ''
}

export default function AdminEvents() {
  const qc = useQueryClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<EventForm>(emptyForm)
  const [error, setError] = useState<string | null>(null)

  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: () => api.get('/events').then(r => r.data)
  })

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        title: form.title,
        description: form.description || '',
        location: form.location || null,
        start_time: form.start_time,
        end_time: form.end_time,
        is_member_only: form.is_member_only,
        capacity: form.capacity ? parseInt(form.capacity) : null,
      }
      return editingId
        ? api.put(`/events/${editingId}`, payload).then(r => r.data)
        : api.post('/events', payload).then(r => r.data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] })
      setShowForm(false); setEditingId(null); setForm(emptyForm); setError(null)
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.detail
      if (Array.isArray(detail)) {
        setError(detail.map((d: any) => `${d.loc?.join('.')}: ${d.msg}`).join(' | '))
      } else {
        setError(detail || `HTTP ${err?.response?.status ?? 'network'}: ${err?.message}`)
      }
    }
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/events/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] })
  })

  function startEdit(event: Event) {
    setEditingId(event.id)
    setForm({
      title: event.title, description: event.description, location: event.location || '',
      start_time: toDatetimeLocal(event.start_time), end_time: toDatetimeLocal(event.end_time),
      is_member_only: event.is_member_only, capacity: event.capacity?.toString() || ''
    })
    setShowForm(true)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Events</h2>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm) }}
          className="bg-primary hover:bg-[#8B0000] text-white text-sm px-4 py-2 rounded-lg transition-colors">
          + New Event
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h3 className="font-semibold mb-4">{editingId ? 'Edit Event' : 'New Event'}</h3>
          <div className="space-y-3">
            <input placeholder="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            <textarea placeholder="Description" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
            <input placeholder="Location (optional)" value={form.location} onChange={e => setForm({...form, location: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Start time</label>
                <input type="datetime-local" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">End time</label>
                <input type="datetime-local" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
            <input type="number" placeholder="Capacity (optional)" value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_member_only} onChange={e => setForm({...form, is_member_only: e.target.checked})} />
              Members only
            </label>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="flex gap-3">
              <button onClick={() => save.mutate()} disabled={!form.title || !form.start_time || !form.end_time || save.isPending}
                className="bg-primary hover:bg-[#8B0000] disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                {save.isPending ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => { setShowForm(false); setEditingId(null) }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading && <div className="text-gray-500">Loading...</div>}
      <div className="space-y-2">
        {events?.map(event => (
          <div key={event.id} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{event.title}</p>
                  {event.is_member_only && <span className="bg-red-100 text-primary text-xs px-2 py-0.5 rounded-full">Members</span>}
                </div>
                <p className="text-sm text-gray-500">{new Date(event.start_time).toLocaleDateString()} · {event.rsvp_count} RSVPs</p>
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => startEdit(event)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-lg transition-colors">Edit</button>
                <button onClick={() => { if (confirm('Delete this event?')) remove.mutate(event.id) }}
                  className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-lg transition-colors">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
