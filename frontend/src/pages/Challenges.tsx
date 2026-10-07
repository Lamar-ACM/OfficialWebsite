import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { challengesApi } from '../lib/api'
import type { ChallengeItem } from '../types'

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

function SubmitModal({
  challenge,
  onClose,
}: {
  challenge: ChallengeItem
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [url, setUrl] = useState(challenge.submission?.proof_url ?? '')
  const [note, setNote] = useState(challenge.submission?.note ?? '')
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () => challengesApi.submit(challenge.id, url.trim(), note.trim() || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] })
      onClose()
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg ?? 'Something went wrong')
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">{challenge.title}</h2>
        <p className="text-sm text-gray-500 mb-4">{challenge.description}</p>

        <label className="block text-sm font-medium text-gray-700 mb-1">
          Proof URL <span className="text-red-500">*</span>
        </label>
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://github.com/you/project"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary mb-3"
        />

        <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={3}
          placeholder="Add any context for the reviewer..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none mb-3"
        />

        <p className="text-xs text-gray-400 mb-4">
          Post your proof in the #challenges Discord channel too so your submission can be verified.
        </p>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!url.trim() || mutation.isPending}
            className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-[#8B0000] disabled:opacity-50 transition-colors"
          >
            {mutation.isPending ? 'Submitting…' : challenge.submission ? 'Resubmit' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Challenges() {
  const [selected, setSelected] = useState<ChallengeItem | null>(null)
  const { data, isLoading } = useQuery({
    queryKey: ['challenges'],
    queryFn: () => challengesApi.getMyChallenges().then(r => r.data),
  })

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-gray-400">Loading challenges…</div>
    )
  }

  const { challenges = [], approved_count = 0, required = 4, membership_granted = false } = data ?? {}
  const progressPct = Math.min((approved_count / required) * 100, 100)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Membership Challenges</h1>
        <p className="text-sm text-gray-500">
          Complete {required} of 7 challenges to earn a free ACM membership. Submit proof via a link,
          and also post in the <span className="font-medium">#challenges</span> Discord channel.
        </p>
      </div>

      {/* Progress */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            {approved_count} / {required} approved
          </span>
          {membership_granted ? (
            <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
              Membership Granted
            </span>
          ) : (
            <span className="text-xs text-gray-400">{required - approved_count} more needed</span>
          )}
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Challenge cards */}
      <div className="space-y-3">
        {challenges.map(challenge => {
          const sub = challenge.submission
          const canSubmit = !sub || sub.status === 'rejected'
          const canResubmit = sub?.status === 'rejected'

          return (
            <div
              key={challenge.id}
              className={`bg-white border rounded-xl p-4 flex items-start gap-4 ${
                sub?.status === 'approved' ? 'border-green-200' : 'border-gray-200'
              }`}
            >
              {/* Number badge */}
              <div
                className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  sub?.status === 'approved'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {sub?.status === 'approved' ? (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                ) : (
                  challenge.id
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-900">{challenge.title}</span>
                  {sub && statusBadge(sub.status)}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{challenge.description}</p>

                {sub?.status === 'rejected' && sub.reviewer_notes && (
                  <p className="mt-1.5 text-xs text-red-600 bg-red-50 rounded-lg px-2.5 py-1.5">
                    <span className="font-medium">Feedback:</span> {sub.reviewer_notes}
                  </p>
                )}

                {sub?.status === 'pending' && (
                  <p className="mt-1 text-xs text-yellow-700">
                    Submitted — waiting for admin review
                  </p>
                )}
              </div>

              {canSubmit && (
                <button
                  onClick={() => setSelected(challenge)}
                  className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-[#8B0000] transition-colors"
                >
                  {canResubmit ? 'Resubmit' : 'Submit'}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {selected && <SubmitModal challenge={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
