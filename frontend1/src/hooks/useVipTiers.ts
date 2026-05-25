import { useEffect, useRef, useState } from 'react'
import api from '../services/api'

export interface VipTier {
  level: number
  name: string
  minValidBet: number
  upReward: number
  cashbackRate: number
  lossReturnRate: number
  lossReturnMax: number
  fridayBonusRate: number
  fridayBonusMax: number
  badgeImage: string
  cardImage: string
  colorCode: string
}

/** Cache trong tab — tránh "nhảy khung" khi chuyển trang giữa các page có VIP icon. */
let memoryCache: VipTier[] | null = null
let inflight: Promise<VipTier[]> | null = null

const fetchVipTiers = async (): Promise<VipTier[]> => {
  if (memoryCache) return memoryCache
  if (inflight) return inflight
  inflight = (async () => {
    try {
      const res = await api.get('/vip-tiers-config')
      // axios interceptor wraps as { success, data } — fall back nếu response thẳng.
      const payload: unknown = (res as unknown as { data: unknown })?.data ?? res
      const value =
        (payload as { value?: VipTier[] })?.value ??
        (payload as { data?: { value?: VipTier[] } })?.data?.value ??
        []
      memoryCache = Array.isArray(value) ? value : []
      return memoryCache
    } catch {
      memoryCache = []
      return memoryCache
    } finally {
      inflight = null
    }
  })()
  return inflight
}

/** Bust cache thủ công (vd sau khi admin update). */
export const invalidateVipTiers = () => {
  memoryCache = null
}

export function useVipTiers(): { tiers: VipTier[]; loading: boolean } {
  const [tiers, setTiers] = useState<VipTier[]>(memoryCache || [])
  const [loading, setLoading] = useState(!memoryCache)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    if (!memoryCache) {
      fetchVipTiers().then((v) => {
        if (mounted.current) {
          setTiers(v)
          setLoading(false)
        }
      })
    }
    return () => {
      mounted.current = false
    }
  }, [])

  return { tiers, loading }
}
