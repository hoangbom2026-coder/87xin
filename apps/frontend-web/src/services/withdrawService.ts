import api from './api'
import { ApiResponse } from '../types'

export type CreateWithdrawBody = {
  amount: number
  currency: string
  payoutType: 'nowpayment' | 'agpayment'
  data: Record<string, unknown>
}

/** POST /withdraw — backend chỉ hỗ trợ nowpayment | agpayment */
export const createWithdrawRequest = async (
  body: CreateWithdrawBody,
): Promise<ApiResponse<unknown>> => {
  return await api.post<any, ApiResponse<unknown>>('/withdraw', body)
}
