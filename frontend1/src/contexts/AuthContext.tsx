import * as React from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '../store'
import type { User } from '../types'

type AuthContextValue = {
  user: User | null
  token: string | null
  isLoggedIn: boolean
  loading: boolean
  error: string | null
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

/** Bọc Redux auth — dùng song song `useAuth` hook. */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useSelector((s: RootState) => s.auth)
  const value = React.useMemo(
    () => ({
      user: auth.user,
      token: auth.token,
      isLoggedIn: Boolean(auth.token),
      loading: auth.loading,
      error: auth.error,
    }),
    [auth.user, auth.token, auth.loading, auth.error],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
  return ctx
}
