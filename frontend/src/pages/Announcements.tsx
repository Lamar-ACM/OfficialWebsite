import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import type { Announcement } from '../types'

export default function Announcements() {
  const { data: announcements, isLoading } = useQuery<Announcement[]>({
    queryKey: ['announcements'],
    queryFn: () => api.get('/announcements').then(r => r.data)
  })

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Announcements</h1>
      {isLoading && <div className="text-gray-500">Loading...</div>}
      <div className="space-y-4">
        {announcements?.map(ann => (
          <Link
            key={ann.id}
            to={`/announcements/${ann.id}`}
            className="block bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <h2 className="font-semibold text-lg">{ann.title}</h2>
              <span className="text-gray-400 text-sm ml-4 shrink-0">
                {new Date(ann.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-gray-500 mt-2 line-clamp-3">{ann.body}</p>
          </Link>
        ))}
        {!isLoading && announcements?.length === 0 && (
          <p className="text-gray-500">No announcements yet.</p>
        )}
      </div>
    </div>
  )
}
