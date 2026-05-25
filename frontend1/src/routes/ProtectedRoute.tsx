import * as React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import type { RootState } from '../store'
import { openAuthModal } from '../utils/openAuthModal'

type ProtectedRouteProps = {
  children: React.ReactNode
}

/** Chặn trang cần đăng nhập — mở modal login nếu chưa có token. */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const token = useSelector((s: RootState) => s.auth.token)
  const location = useLocation()

  if (!token) {
    openAuthModal('login')
    return <Navigate to="/" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}

export default ProtectedRoute
