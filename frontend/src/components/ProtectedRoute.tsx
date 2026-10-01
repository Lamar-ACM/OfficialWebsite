import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface Props { children: ReactNode; requireAdmin?: boolean }

export function ProtectedRoute({ children, requireAdmin = false }: Props) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth()
  if (isLoading) return (
    <div className="flex justify-center p-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  )
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (requireAdmin && !isAdmin) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}
