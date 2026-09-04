import api from './api'
import { ApiResponse } from '../types'
import { asArray } from '../utils/apiList'

export interface DailyChallengeRanking {
  name: string
  multiplier: string
  reward: string
  points: string
  placeImg: string
  /** ảnh đại diện hàng bảng (API có thể trả avatar / avatarUrl) */
  avatar?: string
}

export interface DailyChallengeItem {
  id: string | number
  image: string
  title: string
  prize: string
  endTime: string // ISO string or timestamp
  rankings: DailyChallengeRanking[]
}

export const getDailyChallenges = async (): Promise<DailyChallengeItem[]> => {
  try {
    const response = await api.get<any, ApiResponse<unknown>>('/daily-challenges')
    if (!response.success) return []
    const rows = asArray<DailyChallengeItem>(response.data, ['data', 'items', 'challenges', 'list', 'results'])
    return rows.map((item) => ({
      ...item,
      rankings: Array.isArray(item.rankings)
        ? (item.rankings as unknown as Record<string, unknown>[]).map((r) => ({
            name: String(r.name ?? ''),
            multiplier: String(r.multiplier ?? ''),
            reward: String(r.reward ?? ''),
            points: String(r.points ?? ''),
            placeImg: String(r.placeImg ?? r.placeImage ?? ''),
            avatar:
              r.avatar != null
                ? String(r.avatar)
                : r.avatarUrl != null
                  ? String(r.avatarUrl)
                  : undefined,
          }))
        : [],
    }))
  } catch (error) {
    console.error('Failed to fetch daily challenges', error)
    return []
  }
}
