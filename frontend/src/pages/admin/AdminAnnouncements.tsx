import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import api from '../../lib/api'
import type { Announcement } from '../../types'

interface AnnForm { title: string; body: string; is_public: boolean }
const empty: AnnForm = { title: '', body: '', is_public: true }

export default function AdminAnnouncements() {
  const qc = useQueryClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<AnnForm>(empty)

  const { data: announcements, isLoading } = useQuery<Announcement[]>({
    queryKey: ['announcements-admin'],
    queryFn: () => api.get('/announcements').then(r => r.data)
  })

  const save = useMutation({
    mutationFn: () => editingId
      ? api.put(`/announcements/${editingId}`, form).then(r => r.data)
      : api.post('/announcements', form).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['announcements-admin'] })
      qc.invalidateQueries({ queryKey: ['announcements'] })
      setShowForm(false); setEditingId(null); setForm(empty)
    }
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/announcements/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['announcements-admin'] })
      qc.invalidateQueries({ queryKey: ['announcements'] })
    }
  })

  function startEdit(ann: Announcement) {
    setEditingId(ann.id)
    setForm({ title: ann.title, body: ann.body, is_public: ann.is_public })
    setShowForm(true)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Announcements</h2>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm(empty) }}
          className="bg-primary hover:bg-[#8B0000] text-white text-sm px-4 py-2 rounded-lg transition-colors">
          + New
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h3 className="font-semibold mb-4">{editingId ? 'Edit' : 'New Announcement'}</h3>
          <div className="space-y-3">
            <input placeholder="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            <textarea placeholder="Body" rows={5} value={form.body} onChange={e => setForm({...form, body: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_public} onChange={e => setForm({...form, is_public: e.target.checked})} />
              Visible to public (unchecked = members only)
            </label>
            <div className="flex gap-3">
              <button onClick={() => save.mutate()} disabled={!form.title || !form.body || save.isPending}
                className="bg-primary hover:bg-[#8B0000] disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                {save.isPending ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => { setShowForm(false); setEditingId(null) }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {isLoading && <div className="text-gray-500">Loading...</div>}
      <div className="space-y-2">
        {announcements?.map(ann => (
          <div key={ann.id} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{ann.title}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${ann.is_public ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {ann.is_public ? 'Public' : 'Members only'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{new Date(ann.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => startEdit(ann)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-lg">Edit</button>
                <button onClick={() => { if (confirm('Delete?')) remove.mutate(ann.id) }}
                  className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-lg">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
