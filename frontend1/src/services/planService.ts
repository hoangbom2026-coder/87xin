import api from './api'
import { ApiResponse } from '../types'

/** Khớp backend `plan.model.ts`. `amountType` 0=range, 1=fixed; `returnFor` 0=lifetime, 1=period. */
export interface IPlan {
  _id: string
  name: string
  description?: string
  amountType: 0 | 1
  minimum?: number
  maximum?: number
  amount?: number
  interest: number
  interestStatus: 'percentage' | 'fixed'
  times: number
  returnFor: 0 | 1
  repeatTime: number
  capitalBack: 0 | 1
  userInvestLimit: number
  status: 'active' | 'inactive'
  features?: string[]
  referral?: {
    levels: string[]
    commissions: number[]
  }
}

export const listPlans = async (): Promise<IPlan[]> => {
  const res = await api.get<any, ApiResponse<IPlan[] | { items: IPlan[] }>>('/plans?status=active&limit=100')
  if (!res.success || res.data == null) return []
  const raw = res.data as unknown
  if (Array.isArray(raw)) return raw as IPlan[]
  if (raw && typeof raw === 'object' && Array.isArray((raw as { items?: IPlan[] }).items)) {
    return (raw as { items: IPlan[] }).items
  }
  return []
}

export const getPlan = async (id: string): Promise<IPlan | null> => {
  const res = await api.get<any, ApiResponse<IPlan>>(`/plans/${id}`)
  if (!res.success || !res.data) return null
  const d = res.data as any
  if (d && typeof d === 'object' && '_id' in d) return d as IPlan
  return null
}
