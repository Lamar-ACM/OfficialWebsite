import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { challengesApi } from '../../lib/api'
import type { AdminSubmission } from '../../types'

const STATUS_FILTERS = ['all', 'pending', 'approved', 'rejected'] as const
type Filter = typeof STATUS_FILTERS[number]

function statusBadge(status: string) {
  const classes: Record<string, string> = {
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${classes[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function ReviewModal({
  submission,
  onClose,
}: {
  submission: AdminSubmission
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [action, setAction] = useState<'approved' | 'rejected'>('approved')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () => challengesApi.adminReview(submission.id, action, notes.trim() || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-submissions'] })
      onClose()
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg ?? 'Something went wrong')
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          {submission.discord_avatar && (
            <img src={submission.discord_avatar} className="w-8 h-8 rounded-full" alt="" />
          )}
          <div>
            <p className="text-sm font-semibold text-gray-900">{submission.discord_username}</p>
            <p className="text-xs text-gray-500">{submission.challenge_title}</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
          <p className="font-medium text-gray-700 mb-1">Proof</p>
          <a
            href={submission.proof_url}
            target="_blank"
            rel="noreferrer"
            className="text-primary break-all hover:underline"
          >
            {submission.proof_url}
          </a>
          {submission.note && (
            <p className="mt-2 text-gray-600 text-xs border-t border-gray-200 pt-2">{submission.note}</p>
          )}
        </div>

        <div className="flex gap-3 mb-4">
          <button
            onClick={() => setAction('approved')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
              action === 'approved'
                ? 'bg-green-600 text-white border-green-600'
                : 'border-gray-300 text-gray-600 hover:border-green-400'
            }`}
          >
            Approve
          </button>
          <button
            onClick={() => setAction('rejected')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
              action === 'rejected'
                ? 'bg-red-600 text-white border-red-600'
                : 'border-gray-300 text-gray-600 hover:border-red-400'
            }`}
          >
            Reject
          </button>
        </div>

        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes {action === 'rejected' && <span className="text-gray-400">(tell them what to fix)</span>}
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          placeholder={action === 'rejected' ? 'Explain what was missing…' : 'Optional feedback…'}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none mb-4"
        />

        {action === 'approved' && (
          <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2 mb-4">
            If this is their 4th approval, membership will be granted automatically.
          </p>
        )}

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 transition-colors ${
              action === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {mutation.isPending ? 'Saving…' : action === 'approved' ? 'Approve' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminChallenges() {
  const [filter, setFilter] = useState<Filter>('pending')
  const [reviewing, setReviewing] = useState<AdminSubmission | null>(null)

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['admin-submissions', filter],
    queryFn: () =>
      challengesApi.adminListSubmissions(filter === 'all' ? undefined : filter).then(r => r.data),
  })

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">Challenge Submissions</h2>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 flex-wrap">
        {STATUS_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors capitalize ${
              filter === f ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : submissions.length === 0 ? (
        <p className="text-sm text-gray-400">No {filter === 'all' ? '' : filter} submissions.</p>
      ) : (
        <div className="space-y-3">
          {submissions.map(sub => (
            <div
              key={sub.id}
              className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-4"
            >
              {sub.discord_avatar && (
                <img src={sub.discord_avatar} className="w-9 h-9 rounded-full shrink-0 mt-0.5" alt="" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="text-sm font-semibold text-gray-900">{sub.discord_username}</span>
                  {statusBadge(sub.status)}
                </div>
                <p className="text-xs font-medium text-gray-700 mb-0.5">{sub.challenge_title}</p>
                <a
                  href={sub.proof_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary hover:underline break-all"
                >
                  {sub.proof_url}
                </a>
                {sub.note && <p className="text-xs text-gray-500 mt-0.5">{sub.note}</p>}
                {sub.reviewer_notes && (
                  <p className="text-xs text-gray-400 mt-1">
                    <span className="font-medium">Note:</span> {sub.reviewer_notes}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(sub.submitted_at).toLocaleDateString()}
                </p>
              </div>
              {sub.status === 'pending' && (
                <button
                  onClick={() => setReviewing(sub)}
                  className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-[#8B0000] transition-colors"
                >
                  Review
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {reviewing && <ReviewModal submission={reviewing} onClose={() => setReviewing(null)} />}
    </div>
  )
}
