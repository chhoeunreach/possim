import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User } from '@/types'
import { api, setToken, clearToken } from '@/lib/api'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

const USER_KEY = 'pos_user'

function getStoredUser(): User | null {
  try {
    const stored = localStorage.getItem(USER_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

function storeUser(user: User) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

function clearStoredUser() {
  localStorage.removeItem(USER_KEY)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getStoredUser)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('pos_token')
    if (!token) {
      setLoading(false)
      return
    }
    api.getCurrentShift()
      .then(() => setLoading(false))
      .catch(() => {
        clearToken()
        clearStoredUser()
        setUser(null)
        setLoading(false)
      })
  }, [])

  const login = async (username: string, password: string) => {
    const result = await api.login(username, password)
    setToken(result.token)
    storeUser(result.user)
    setUser(result.user)
  }

  const logout = () => {
    clearToken()
    clearStoredUser()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
