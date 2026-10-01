import { Link } from 'react-router-dom'

export default function MembershipCancel() {
  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="text-6xl mb-6">↩</div>
      <h1 className="text-2xl font-bold mb-3">Payment Cancelled</h1>
      <p className="text-gray-600 mb-8">No charge was made. You can purchase membership anytime.</p>
      <Link
        to="/membership"
        className="bg-primary hover:bg-[#8B0000] text-white font-semibold px-6 py-3 rounded-lg transition-colors inline-block"
      >
        Try Again
      </Link>
    </div>
  )
}
