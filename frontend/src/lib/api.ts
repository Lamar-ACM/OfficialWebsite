import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const res = await axios.post(
            `${api.defaults.baseURL}/auth/refresh`,
            null,
            { params: { refresh_token: refresh } }
          )
          localStorage.setItem('access_token', res.data.access_token)
          localStorage.setItem('refresh_token', res.data.refresh_token)
          original.headers.Authorization = `Bearer ${res.data.access_token}`
          return api(original)
        } catch {
          // refresh failed — fall through to logout
        }
      }
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

import type { ChallengesResponse, AdminSubmission } from '../types'

export const challengesApi = {
  getMyChallenges: (): Promise<{ data: ChallengesResponse }> =>
    api.get('/challenges'),

  submit: (challengeId: number, proofUrl: string, note?: string): Promise<unknown> =>
    api.post(`/challenges/${challengeId}/submit`, { proof_url: proofUrl, note }),

  adminListSubmissions: (status?: string): Promise<{ data: AdminSubmission[] }> =>
    api.get('/challenges/admin/submissions', { params: status ? { status } : {} }),

  adminReview: (submissionId: string, status: 'approved' | 'rejected', reviewerNotes?: string): Promise<unknown> =>
    api.patch(`/challenges/admin/submissions/${submissionId}/review`, {
      status,
      reviewer_notes: reviewerNotes,
    }),
}
