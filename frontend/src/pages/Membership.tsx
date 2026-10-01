import { useQuery, useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import api from '../lib/api'
import type { Membership } from '../types'

function formatDate(dt: string) {
  return new Date(dt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function MembershipPage() {
  const [error, setError] = useState<string | null>(null)

  const { data: membership, isLoading } = useQuery<Membership | null>({
    queryKey: ['membership'],
    queryFn: () => api.get('/membership/me').then(r => r.data)
  })

  const checkout = useMutation({
    mutationFn: () => api.post<{ checkout_url: string }>('/membership/checkout').then(r => r.data),
    onSuccess: (data) => { window.location.href = data.checkout_url },
    onError: () => setError('Failed to start checkout. Please try again.')
  })

  const isActive = membership?.status === 'active'

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <Link to="/dashboard" className="text-primary hover:underline text-sm mb-6 inline-block">← Back to Dashboard</Link>
      <h1 className="text-3xl font-bold mb-8">Membership</h1>

      {isLoading ? (
        <div className="text-gray-500">Loading...</div>
      ) : isActive ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <div className="text-5xl mb-4">✓</div>
          <h2 className="text-xl font-semibold text-green-800 mb-2">You&apos;re an Active Member!</h2>
          <p className="text-green-700">Valid until {membership?.end_date ? formatDate(membership.end_date) : '—'}</p>
          <p className="text-sm text-green-600 mt-3">Your Discord &quot;Member&quot; role is active in the Lamar ACM server.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-8">
          <h2 className="text-xl font-semibold mb-2">Join Lamar ACM</h2>
          <p className="text-gray-500 mb-6">Become a paying member to unlock:</p>
          <ul className="space-y-3 mb-8 text-gray-700">
            {[
              'Access to member-only events',
              'Member-only announcements and resources',
              'Discord "Member" role assigned automatically',
              'Priority support via the ticket system',
              '1-year membership'
            ].map(item => (
              <li key={item} className="flex items-center gap-2">
                <span className="text-green-500">✓</span> {item}
              </li>
            ))}
          </ul>
          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
          <button
            onClick={() => checkout.mutate()}
            disabled={checkout.isPending}
            className="w-full bg-primary hover:bg-[#8B0000] disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {checkout.isPending ? 'Redirecting to checkout...' : 'Purchase Membership'}
          </button>
          <p className="text-xs text-gray-400 mt-3 text-center">Secure payment via Stripe</p>
        </div>
      )}
    </div>
  )
}
