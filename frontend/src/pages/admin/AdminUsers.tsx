import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import api from '../../lib/api'

interface MemberListItem {
  id: string
  discord_username: string
  email: string | null
  role: string
  membership_status: string | null
  membership_end_date: string | null
}

export default function AdminUsers() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')

  const { data: users, isLoading } = useQuery<MemberListItem[]>({
    queryKey: ['admin-members'],
    queryFn: () => api.get('/admin/members').then(r => r.data)
  })

  const overrideMembership = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: string }) =>
      api.patch(`/admin/users/${userId}/membership`, { status }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-members'] })
  })

  const promoteToAdmin = useMutation({
    mutationFn: (userId: string) =>
      api.patch(`/admin/users/${userId}/role`, { role: 'admin' }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-members'] })
  })

  const deactivateUser = useMutation({
    mutationFn: (userId: string) =>
      api.patch(`/admin/users/${userId}/deactivate`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-members'] })
  })

  const filtered = users?.filter(u =>
    u.discord_username.toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  ) || []

  const statusBadge = (status: string | null) => {
    if (status === 'active') return <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">Active</span>
    if (status === 'expired') return <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">Expired</span>
    return <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">None</span>
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Users</h2>
      <input
        type="text"
        placeholder="Search by username or email..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary"
      />
      {isLoading && <div className="text-gray-500">Loading...</div>}
      <div className="space-y-2">
        {filtered.map(user => (
          <div key={user.id} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex flex-wrap justify-between items-start gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{user.discord_username}</p>
                  {user.role === 'admin' && <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">Admin</span>}
                </div>
                <p className="text-sm text-gray-500">{user.email || 'No email'}</p>
                <div className="flex items-center gap-2 mt-1">
                  {statusBadge(user.membership_status)}
                  {user.membership_end_date && (
                    <span className="text-xs text-gray-400">until {new Date(user.membership_end_date).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {user.membership_status !== 'active' && (
                  <button
                    onClick={() => overrideMembership.mutate({ userId: user.id, status: 'active' })}
                    className="text-xs bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1 rounded-lg transition-colors"
                  >
                    Activate
                  </button>
                )}
                {user.membership_status === 'active' && (
                  <button
                    onClick={() => overrideMembership.mutate({ userId: user.id, status: 'expired' })}
                    className="text-xs bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded-lg transition-colors"
                  >
                    Expire
                  </button>
                )}
                {user.role !== 'admin' && (
                  <button
                    onClick={() => { if (confirm(`Promote ${user.discord_username} to admin?`)) promoteToAdmin.mutate(user.id) }}
                    className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-1 rounded-lg transition-colors"
                  >
                    Make Admin
                  </button>
                )}
                <button
                  onClick={() => { if (confirm(`Deactivate ${user.discord_username}?`)) deactivateUser.mutate(user.id) }}
                  className="text-xs bg-gray-100 text-gray-500 hover:bg-gray-200 px-3 py-1 rounded-lg transition-colors"
                >
                  Deactivate
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && !isLoading && <div className="text-gray-500 text-sm">No users found.</div>}
      </div>
    </div>
  )
}
