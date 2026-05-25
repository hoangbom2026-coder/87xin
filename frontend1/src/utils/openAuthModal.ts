export type AuthModalMode = 'login' | 'register'

export const AUTH_MODAL_OPEN_EVENT = 'app:open-auth'

export function openAuthModal(mode: AuthModalMode = 'login') {
  window.dispatchEvent(new CustomEvent(AUTH_MODAL_OPEN_EVENT, { detail: { mode } }))
}
