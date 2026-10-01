import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import logo from '../assets/img.png'

export function Navbar() {
  const { user, isAuthenticated, isAdmin, login, logout } = useAuth()
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center">
            <img src={logo} alt="Lamar ACM" className="h-9 w-auto" />
          </Link>
          <div className="hidden sm:flex items-center gap-6 text-sm font-medium">
            <NavLink to="/events" className={({ isActive }) => isActive ? 'text-primary' : 'text-gray-600 hover:text-gray-900'}>Events</NavLink>
            <NavLink to="/announcements" className={({ isActive }) => isActive ? 'text-primary' : 'text-gray-600 hover:text-gray-900'}>Announcements</NavLink>
            {isAuthenticated && <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'text-primary' : 'text-gray-600 hover:text-gray-900'}>Dashboard</NavLink>}
            {isAdmin && <NavLink to="/admin" className={({ isActive }) => isActive ? 'text-primary' : 'text-gray-600 hover:text-gray-900'}>Admin</NavLink>}
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {user?.discord_avatar && (
                  <div className="relative">
                    <img
                      src={user.discord_avatar}
                      className="w-8 h-8 rounded-full"
                      alt="avatar"
                    />
                    {user?.is_verified && (
                      <span className="absolute -bottom-0.5 -right-0.5 bg-blue-500 rounded-full w-4 h-4 flex items-center justify-center ring-2 ring-white">
                        <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                        </svg>
                      </span>
                    )}
                  </div>
                )}
                <span className="hidden sm:block text-sm text-gray-700">{user?.discord_username}</span>
                <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-900">Sign out</button>
              </div>
            ) : (
              <button
                onClick={login}
                className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Sign in with Discord
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
