import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
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

  if (isLoading) return <div className="text-gray-500">Loading stats...</div>

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Overview</h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Active Members" value={stats?.active_members ?? 0} to="/admin/users" color="text-green-600" />
        <StatCard label="Total Users" value={stats?.total_members ?? 0} to="/admin/users" color="text-gray-800" />
        <StatCard label="Open Tickets" value={stats?.open_tickets ?? 0} to="/admin/tickets" color="text-blue-600" />
        <StatCard label="In Progress" value={stats?.in_progress_tickets ?? 0} to="/admin/tickets" color="text-yellow-600" />
        <StatCard label="Upcoming Events" value={stats?.upcoming_events ?? 0} to="/admin/events" color="text-primary" />
      </div>
    </div>
  )
}
