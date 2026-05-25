import api from './api'
import { ApiResponse } from '../types'
import { resolveAssetUrl } from '../utils/assets'

export interface Banner {
  _id: string
  image: string
  link?: string
  order?: number
  status?: boolean
}

/** Banner public — backend trả filename, FE tự resolve host + `/banners/`. */
export const getBanners = async (): Promise<ApiResponse<Banner[]>> => {
  const res = await api.get<any, ApiResponse<any>>('/banner')
  if (!res.success) return res as ApiResponse<Banner[]>
  const raw = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.items) ? res.data.items : []
  const data: Banner[] = raw.map((b: any) => ({
    _id: b._id,
    image: resolveBannerImage(b.image),
    link: b.link || undefined,
    order: b.order,
    status: b.status,
  }))
  return { ...res, data }
}

export const resolveBannerImage = (image?: string): string => {
  if (!image) return ''
  if (/^https?:\/\//i.test(image)) return image
  if (image.startsWith('/')) return resolveAssetUrl(image)
  return resolveAssetUrl(`/banners/${image}`)
}
