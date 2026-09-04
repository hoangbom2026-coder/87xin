export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface ErrorResponse {
  success: false
  message: string
  code?: string | number
  errors?: Record<string, string[]>
}
