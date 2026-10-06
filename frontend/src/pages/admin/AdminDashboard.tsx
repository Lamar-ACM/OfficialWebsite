import { useQuery, useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import api from '../../lib/api'
import type { AdminStats } from '../../types'

interface StatCardProps { label: string; value: number; to: string; color: string }
function StatCard({ label, value, to, color }: StatCardProps) {
  return (
    <Link to={to} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow block">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-4xl font-bold mt-1 ${color}`}>{value}</p>
    </Link>
  )
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then(r => r.data)
  })

  const [syncResult, setSyncResult] = useState<{ assigned: number; failed: number; total: number } | null>(null)

  const syncRoles = useMutation({
    mutationFn: () => api.post('/admin/sync-discord-roles').then(r => r.data),
    onSuccess: (data) => setSyncResult(data),
  })

  if (isLoading) return <div className="text-gray-500">Loading stats...</div>

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Overview</h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard label="Active Members" value={stats?.active_members ?? 0} to="/admin/users" color="text-green-600" />
        <StatCard label="Total Users" value={stats?.total_members ?? 0} to="/admin/users" color="text-gray-800" />
        <StatCard label="Open Tickets" value={stats?.open_tickets ?? 0} to="/admin/tickets" color="text-blue-600" />
        <StatCard label="In Progress" value={stats?.in_progress_tickets ?? 0} to="/admin/tickets" color="text-yellow-600" />
        <StatCard label="Upcoming Events" value={stats?.upcoming_events ?? 0} to="/admin/events" color="text-primary" />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="font-medium mb-1">Discord Role Sync</h3>
        <p className="text-sm text-gray-500 mb-3">
          Assign the member Discord role to everyone who has an active membership on the site.
        </p>
        <div className="flex items-center gap-4">
          <button
            onClick={() => { setSyncResult(null); syncRoles.mutate() }}
            disabled={syncRoles.isPending}
            className="bg-[#5865F2] hover:bg-[#4752C4] disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {syncRoles.isPending ? 'Syncing…' : 'Sync Discord Roles'}
          </button>
          {syncResult && (
            <p className="text-sm text-gray-600">
              Done — <span className="text-green-600 font-medium">{syncResult.assigned} assigned</span>
              {syncResult.failed > 0 && <span className="text-red-500 font-medium">, {syncResult.failed} failed</span>}
              <span className="text-gray-400"> ({syncResult.total} total active members)</span>
            </p>
          )}
          {syncRoles.isError && (
            <p className="text-sm text-red-500">Sync failed — check bot connection.</p>
          )}
        </div>
      </div>
    </div>
  )
}
