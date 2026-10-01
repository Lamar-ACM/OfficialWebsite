import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Turnstile } from '@marsidev/react-turnstile'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || ''

export default function VerifyPage() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const verify = useMutation({
    mutationFn: (token: string) =>
      api.post('/auth/verify', { token }).then(r => r.data),
    onSuccess: async () => {
      await refreshUser()
      queryClient.invalidateQueries({ queryKey: ['me'] })
      navigate('/dashboard')
    },
    onError: () => {
      setError('Verification failed. Please try again.')
      setCaptchaToken(null)
    },
  })

  if (user?.is_verified) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">✓</div>
        <h1 className="text-2xl font-bold mb-2">Already Verified</h1>
        <p className="text-gray-500 mb-6">Your account is verified and your Discord role is active.</p>
        <button onClick={() => navigate('/dashboard')} className="text-primary hover:underline">
          Back to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
        <div className="text-4xl mb-4">🔐</div>
        <h1 className="text-2xl font-bold mb-2">Verify Your Account</h1>
        <p className="text-gray-500 mb-6 text-sm">
          Complete the verification below to receive the <strong>Verified</strong> role in the Lamar ACM Discord server.
        </p>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <div className="flex justify-center mb-6">
          <Turnstile
            siteKey={SITE_KEY}
            onSuccess={(token) => setCaptchaToken(token)}
            onError={() => setError('CAPTCHA error. Please refresh and try again.')}
            onExpire={() => setCaptchaToken(null)}
          />
        </div>

        <button
          onClick={() => captchaToken && verify.mutate(captchaToken)}
          disabled={!captchaToken || verify.isPending}
          className="w-full bg-primary hover:bg-[#8B0000] disabled:opacity-40 text-white font-semibold py-3 rounded-lg transition-colors"
        >
          {verify.isPending ? 'Verifying...' : 'Verify Me'}
        </button>
      </div>
    </div>
  )
}
