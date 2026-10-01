import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

export default function MembershipSuccess() {
  const qc = useQueryClient()
  useEffect(() => { qc.invalidateQueries({ queryKey: ['membership'] }) }, [qc])
  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="text-6xl mb-6">🎉</div>
      <h1 className="text-3xl font-bold mb-3">Welcome to Lamar ACM!</h1>
      <p className="text-gray-600 mb-2">Your membership is now active.</p>
      <p className="text-gray-500 text-sm mb-8">Your Discord &quot;Member&quot; role has been assigned. Check the server!</p>
      <Link
        to="/dashboard"
        className="bg-primary hover:bg-[#8B0000] text-white font-semibold px-6 py-3 rounded-lg transition-colors inline-block"
      >
        Go to Dashboard
      </Link>
    </div>
  )
}
