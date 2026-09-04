import api from './api'
import { User, ApiResponse } from '../types'

export const login = async (username: string, password: string): Promise<ApiResponse<{ user: User, token: string }>> => {
  const response = await api.post<any, ApiResponse<any>>('/auth/login', { username, password })
  if (response.success && response.data) {
    const raw = response.data
    // Backend trả token ở nhiều field — normalize về .token
    const resolved = raw?.token ?? raw?.accessToken ?? raw?.tokens?.access?.token
    if (resolved) response.data.token = resolved
  }
  return response
}

export const register = async (userData: any): Promise<ApiResponse<any>> => {
  const response = await api.post<any, ApiResponse<any>>('/auth/register', userData)
  if (response.success && response.data) {
    const raw = response.data
    const resolved = raw?.token ?? raw?.accessToken ?? raw?.tokens?.access?.token
    if (resolved) response.data.token = resolved
  }
  return response
}

export const getProfile = async (): Promise<ApiResponse<User>> => {
  const response = await api.get<any, ApiResponse<any>>('/auth/me')
  if (response.success && response.data?.user) {
    response.data = response.data.user
  }
  return response
}

export const logout = (): void => {
  localStorage.removeItem('token')
  window.location.href = '/'
}
