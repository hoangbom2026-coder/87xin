/**
 * Chuẩn hoá payload API (object lồng `{ data, items, games }`) thành mảng,
 * tránh lỗi runtime `.map is not a function` khi backend không trả array thuần.
 */
export function asArray<T>(payload: unknown, listKeys: readonly string[] = [
  'games', 'items', 'data', 'list', 'results', 'providers', 'records', 'rows',
  'promotions', 'challenges', 'categories',
]): T[] {
  if (payload == null) return []
  if (Array.isArray(payload)) return payload as T[]
  if (typeof payload !== 'object') return []
  const o = payload as Record<string, unknown>
  for (const k of listKeys) {
    const v = o[k]
    if (Array.isArray(v)) return v as T[]
  }
  const inner = o.data
  if (inner != null && typeof inner === 'object' && !Array.isArray(inner)) {
    return asArray<T>(inner, listKeys)
  }
  if (Array.isArray(inner)) return inner as T[]
  return []
}
