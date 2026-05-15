import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api, getToken, setToken } from '../api/client'
import type { AuthResponse } from '../api/types'

interface AuthState {
  email: string
  displayName: string
}

interface AuthContextValue {
  user: AuthState | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => void
}

const STORAGE_KEY = 'financeapp.user'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function readStoredUser(): AuthState | null {
  if (!getToken()) return null
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthState
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthState | null>(readStoredUser)

  const persist = useCallback((res: AuthResponse) => {
    setToken(res.token)
    const state: AuthState = { email: res.email, displayName: res.displayName }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    setUser(state)
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api<AuthResponse>('/auth/login', {
        method: 'POST',
        body: { email, password },
        auth: false,
      })
      persist(res)
    },
    [persist],
  )

  const register = useCallback(
    async (email: string, password: string, displayName: string) => {
      const res = await api<AuthResponse>('/auth/register', {
        method: 'POST',
        body: { email, password, displayName },
        auth: false,
      })
      persist(res)
    },
    [persist],
  )

  const logout = useCallback(() => {
    setToken(null)
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, login, register, logout }),
    [user, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return ctx
}
