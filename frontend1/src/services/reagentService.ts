import api from './api'
import { ApiResponse } from '../types'

export interface ReagentStatus {
  enrolled: boolean;
  status: 'pending' | 'active' | 'rejected' | 'none';
  balance: number;
}

export interface EnrollmentRule {
  minBalance: number;
  description: string;
}

export const getReagentStatus = async (): Promise<ApiResponse<ReagentStatus>> => {
  return await api.get<any, ApiResponse<ReagentStatus>>('/reagent-program/status')
}

export const getReagentRules = async (): Promise<ApiResponse<EnrollmentRule>> => {
  return await api.get<any, ApiResponse<EnrollmentRule>>('/reagent-program/rules')
}

export const joinReagentProgram = async (): Promise<ApiResponse<any>> => {
  return await api.post<any, ApiResponse<any>>('/reagent-program/join', {})
}

export const getReagentTree = async (): Promise<ApiResponse<any[]>> => {
  return await api.get<any, ApiResponse<any[]>>('/reagent-program/tree')
}

export const getPlayerTransactions = async (payload: {
  type: string
  currentPage: number
  rowsPerPage: number
  date?: { start: string; end: string }
}) => {
  return await api.post<any, ApiResponse<any>>('/player/transaction', payload)
}

/** GET /reagent-program/invest-logs — chuẩn hóa mảng (backend có thể bọc { success, data }). */
export const getInvestLogs = async (): Promise<ApiResponse<any[]>> => {
  const res = await api.get<any, ApiResponse<any>>('/reagent-program/invest-logs')
  if (!res.success) return { ...res, data: [] }
  const raw = res.data
  let list: any[] = []
  if (Array.isArray(raw)) list = raw
  else if (raw && Array.isArray(raw.data)) list = raw.data
  else if (raw && Array.isArray(raw.docs)) list = raw.docs
  return { ...res, data: list }
}

export interface AgencyPlansPayload {
  items: any[]
  total: number
  page: number
  limit: number
}

/** GET /agency/plans — danh sách gói active (cần Bearer). */
export const getAgencyPlans = async (params?: { page?: number; limit?: number }): Promise<ApiResponse<AgencyPlansPayload>> => {
  const res = await api.get<any, ApiResponse<any>>('/agency/plans', {
    params: { page: params?.page ?? 1, limit: params?.limit ?? 50 },
  })
  if (!res.success) {
    return { ...res, data: { items: [], total: 0, page: 1, limit: 20 } }
  }
  const raw = res.data
  const items = Array.isArray(raw?.items) ? raw.items : Array.isArray(raw) ? raw : []
  const total = Number(raw?.total ?? items.length) || 0
  const page = Number(raw?.page ?? 1) || 1
  const limit = Number(raw?.limit ?? 20) || 20
  return { ...res, data: { items, total, page, limit } }
}

/** POST /agency/invest — trừ số dư ví & tạo invest-log (planId = Mongo _id gói). */
export const postAgencyInvest = async (body: { planId: string; amount: number }): Promise<ApiResponse<any>> => {
  return await api.post<any, ApiResponse<any>>('/agency/invest', body)
}
