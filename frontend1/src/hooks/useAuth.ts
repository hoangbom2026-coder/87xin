import { useSelector } from 'react-redux'
import type { RootState } from '../store'

/** Lấy auth từ Redux — dùng `useAuthContext` nếu cần context wrapper. */
export function useAuth() {
  const { user, token, loading, error } = useSelector((s: RootState) => s.auth)
  return { user, token, isLoggedIn: Boolean(token), loading, error }
}
