import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/events', label: 'Events' },
  { to: '/admin/announcements', label: 'Announcements' },
  { to: '/admin/tickets', label: 'Tickets' },
  { to: '/admin/challenges', label: 'Challenges' },
]

export default function AdminLayout() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Admin Panel</h1>
      <div className="flex flex-col sm:flex-row gap-6">
        <aside className="sm:w-48 shrink-0">
          <nav className="flex sm:flex-col gap-1 overflow-x-auto sm:overflow-visible">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
