import * as React from 'react'
import { AUTH_MODAL_OPEN_EVENT, type AuthModalMode } from '../utils/openAuthModal'

type UIContextValue = {
  authModalOpen: boolean
  authModalMode: AuthModalMode
  openAuth: (mode?: AuthModalMode) => void
  closeAuth: () => void
}

const UIContext = React.createContext<UIContextValue | null>(null)

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [authModalOpen, setAuthModalOpen] = React.useState(false)
  const [authModalMode, setAuthModalMode] = React.useState<AuthModalMode>('login')

  const openAuth = React.useCallback((mode: AuthModalMode = 'login') => {
    setAuthModalMode(mode)
    setAuthModalOpen(true)
    window.dispatchEvent(new CustomEvent(AUTH_MODAL_OPEN_EVENT, { detail: { mode } }))
  }, [])

  const closeAuth = React.useCallback(() => setAuthModalOpen(false), [])

  const value = React.useMemo(
    () => ({ authModalOpen, authModalMode, openAuth, closeAuth }),
    [authModalOpen, authModalMode, openAuth, closeAuth],
  )

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

export function useUI() {
  const ctx = React.useContext(UIContext)
  if (!ctx) throw new Error('useUI must be used within UIProvider')
  return ctx
}
