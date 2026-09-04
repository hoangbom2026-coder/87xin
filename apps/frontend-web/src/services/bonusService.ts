import api from './api'
import { ApiResponse } from '../types'

/** Gói bonus mẫu (CMS) — GET /bonus/list */
export interface BonusDoc {
  _id: string
  title?: string
  name?: string
  description?: string
  status?: boolean
  amount?: number
}

/** Bản ghi bonus gán cho user — POST /player/bonus (aggregate có `bonus`) */
export type PlayerBonusRow = {
  _id: string
  userId?: string
  bonusId?: string
  amount?: number
  goalAmount?: number
  processAmount?: number
  status?: string
  bonus?: {
    _id?: string
    title?: string
    name?: string
    description?: string
  }
}

export const getBonusTemplates = async (): Promise<BonusDoc[]> => {
  const res = await api.get<any, ApiResponse<BonusDoc[]>>('/bonus/list')
  if (!res.success || !res.data) return []
  const raw = res.data as any
  return Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : []
}

/** Danh sách bonus của tài khoản (player-bonuses + lookup bonus) */
export const getPlayerAssignedBonuses = async (params?: {
  status?: string
  currentPage?: number
  rowsPerPage?: number
}): Promise<PlayerBonusRow[]> => {
  const res = await api.post<any, ApiResponse<{ data: PlayerBonusRow[]; total?: number }>>('/player/bonus', {
    status: params?.status ?? 'all',
    currentPage: params?.currentPage ?? 1,
    rowsPerPage: params?.rowsPerPage ?? 50,
  })
  if (!res.success || !res.data) return []
  const body = res.data as { data?: PlayerBonusRow[]; total?: number }
  if (Array.isArray(body?.data)) return body.data
  return []
}

/** @deprecated Dùng getPlayerAssignedBonuses cho Voucher; getBonusTemplates cho danh sách mẫu */
export const getBonusList = getBonusTemplates

/** GET /player/bonus/:bonusId/claim — bonusId là _id của player-bonuses, trạng thái active */
export const claimPlayerBonus = async (bonusId: string): Promise<ApiResponse<unknown>> => {
  return await api.get<any, ApiResponse<unknown>>(`/player/bonus/${bonusId}/claim`)
}
