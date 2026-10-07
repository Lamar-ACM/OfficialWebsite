import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'

import Home from './pages/Home'
import Events from './pages/Events'
import EventDetail from './pages/EventDetail'
import Announcements from './pages/Announcements'
import AnnouncementDetail from './pages/AnnouncementDetail'
import Login from './pages/Login'
import AuthCallback from './pages/AuthCallback'
import Dashboard from './pages/Dashboard'
import Membership from './pages/Membership'
import MembershipSuccess from './pages/MembershipSuccess'
import MembershipCancel from './pages/MembershipCancel'
import Tickets from './pages/Tickets'
import TicketNew from './pages/TicketNew'
import TicketDetail from './pages/TicketDetail'
import Verify from './pages/Verify'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminEvents from './pages/admin/AdminEvents'
import AdminAnnouncements from './pages/admin/AdminAnnouncements'
import AdminTickets from './pages/admin/AdminTickets'
import AdminTicketDetail from './pages/admin/AdminTicketDetail'
import AdminChallenges from './pages/admin/AdminChallenges'
import Challenges from './pages/Challenges'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/:id" element={<EventDetail />} />
              <Route path="/announcements" element={<Announcements />} />
              <Route path="/announcements/:id" element={<AnnouncementDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/membership" element={<ProtectedRoute><Membership /></ProtectedRoute>} />
              <Route path="/membership/success" element={<ProtectedRoute><MembershipSuccess /></ProtectedRoute>} />
              <Route path="/membership/cancel" element={<ProtectedRoute><MembershipCancel /></ProtectedRoute>} />
              <Route path="/verify" element={<ProtectedRoute><Verify /></ProtectedRoute>} />
              <Route path="/tickets" element={<ProtectedRoute><Tickets /></ProtectedRoute>} />
              <Route path="/tickets/new" element={<ProtectedRoute><TicketNew /></ProtectedRoute>} />
              <Route path="/tickets/:id" element={<ProtectedRoute><TicketDetail /></ProtectedRoute>} />
              <Route path="/challenges" element={<ProtectedRoute><Challenges /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminLayout /></ProtectedRoute>}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="events" element={<AdminEvents />} />
                <Route path="announcements" element={<AdminAnnouncements />} />
                <Route path="tickets" element={<AdminTickets />} />
                <Route path="tickets/:id" element={<AdminTicketDetail />} />
                <Route path="challenges" element={<AdminChallenges />} />
              </Route>
            </Routes>
          </Layout>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
