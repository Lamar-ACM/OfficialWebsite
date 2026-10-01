import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import api from '../lib/api'
import type { Announcement } from '../types'

export default function AnnouncementDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: ann, isLoading, error } = useQuery<Announcement>({
    queryKey: ['announcement', id],
    queryFn: () => api.get(`/announcements/${id}`).then(r => r.data)
  })

  if (isLoading) return <div className="max-w-3xl mx-auto px-4 py-12 text-gray-500">Loading...</div>
  if (error) return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-gray-500">
      Not found. <Link to="/announcements" className="text-primary">Back</Link>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <Link to="/announcements" className="text-primary hover:underline text-sm mb-6 inline-block">
        ← Back to announcements
      </Link>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-3xl font-bold mb-2">{ann?.title}</h1>
        <p className="text-gray-400 text-sm mb-8">
          {ann && new Date(ann.created_at).toLocaleDateString('en-US', {
            month: 'long', day: 'numeric', year: 'numeric'
          })}
        </p>
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{ann?.body}</p>
      </div>
    </div>
  )
}
