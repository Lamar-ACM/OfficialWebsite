import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import logo from '../assets/img.png'

export function Navbar() {
  const { user, isAuthenticated, isAdmin, login, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  function handleNav(path: string) {
    setOpen(false)
    navigate(path)
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'text-primary font-semibold' : 'text-gray-600 hover:text-gray-900'

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center" onClick={() => setOpen(false)}>
            <img src={logo} alt="Lamar ACM" className="h-9 w-auto" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-6 text-sm font-medium">
            <NavLink to="/events" className={linkClass}>Events</NavLink>
            <NavLink to="/announcements" className={linkClass}>Announcements</NavLink>
            {isAuthenticated && <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>}
            {isAuthenticated && <NavLink to="/challenges" className={linkClass}>Challenges</NavLink>}
            {isAdmin && <NavLink to="/admin" className={linkClass}>Admin</NavLink>}
          </div>

          {/* Desktop right side */}
          <div className="hidden sm:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {user?.discord_avatar && (
                  <div className="relative">
                    <img src={user.discord_avatar} className="w-8 h-8 rounded-full" alt="avatar" />
                    {user?.is_verified && (
                      <span className="absolute -bottom-0.5 -right-0.5 bg-blue-500 rounded-full w-4 h-4 flex items-center justify-center ring-2 ring-white">
                        <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                        </svg>
                      </span>
                    )}
                  </div>
                )}
                <span className="text-sm text-gray-700">{user?.discord_username}</span>
                <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-900">Sign out</button>
              </>
            ) : (
              <button onClick={login} className="bg-primary hover:bg-[#8B0000] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Sign in with Discord
              </button>
            )}
          </div>

          {/* Mobile: avatar + burger */}
          <div className="flex sm:hidden items-center gap-3">
            {isAuthenticated && user?.discord_avatar && (
              <div className="relative">
                <img src={user.discord_avatar} className="w-8 h-8 rounded-full" alt="avatar" />
                {user?.is_verified && (
                  <span className="absolute -bottom-0.5 -right-0.5 bg-blue-500 rounded-full w-4 h-4 flex items-center justify-center ring-2 ring-white">
                    <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                    </svg>
                  </span>
                )}
              </div>
            )}
            <button
              onClick={() => setOpen(!open)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Menu"
            >
              {open ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="sm:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-1">
          {isAuthenticated && (
            <div className="flex items-center gap-3 px-2 py-3 border-b border-gray-100 mb-2">
              <div>
                <p className="text-sm font-medium text-gray-900">{user?.discord_username}</p>
                {user?.email && <p className="text-xs text-gray-400">{user.email}</p>}
              </div>
            </div>
          )}
          <button onClick={() => handleNav('/events')} className="w-full text-left px-2 py-3 text-sm font-medium text-gray-700 hover:text-primary rounded-lg hover:bg-gray-50 transition-colors">
            Events
          </button>
          <button onClick={() => handleNav('/announcements')} className="w-full text-left px-2 py-3 text-sm font-medium text-gray-700 hover:text-primary rounded-lg hover:bg-gray-50 transition-colors">
            Announcements
          </button>
          {isAuthenticated && (
            <button onClick={() => handleNav('/dashboard')} className="w-full text-left px-2 py-3 text-sm font-medium text-gray-700 hover:text-primary rounded-lg hover:bg-gray-50 transition-colors">
              Dashboard
            </button>
          )}
          {isAuthenticated && (
            <button onClick={() => handleNav('/challenges')} className="w-full text-left px-2 py-3 text-sm font-medium text-gray-700 hover:text-primary rounded-lg hover:bg-gray-50 transition-colors">
              Challenges
            </button>
          )}
          {isAdmin && (
            <button onClick={() => handleNav('/admin')} className="w-full text-left px-2 py-3 text-sm font-medium text-gray-700 hover:text-primary rounded-lg hover:bg-gray-50 transition-colors">
              Admin
            </button>
          )}
          <div className="pt-2 border-t border-gray-100 mt-2">
            {isAuthenticated ? (
              <button onClick={() => { setOpen(false); logout() }} className="w-full text-left px-2 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                Sign out
              </button>
            ) : (
              <button onClick={() => { setOpen(false); login() }} className="w-full bg-primary hover:bg-[#8B0000] text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors">
                Sign in with Discord
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
