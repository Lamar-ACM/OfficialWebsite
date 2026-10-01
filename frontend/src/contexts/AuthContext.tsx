import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import api from '../lib/api'
import type { User } from '../types'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  isMember: boolean
  login: () => void
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = async () => {
    const token = localStorage.getItem('access_token')
    if (!token) { setIsLoading(false); return }
    try {
      const { data } = await api.get<User>('/users/me')
      setUser(data)
    } catch {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { refreshUser() }, [])

  const login = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/discord`
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
    window.location.href = '/'
  }

  return (
    <AuthContext.Provider value={{
      user, isLoading,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
      isMember: !!user,
      login, logout, refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
