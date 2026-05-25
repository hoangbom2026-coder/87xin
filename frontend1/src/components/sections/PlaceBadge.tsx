import * as React from 'react'
import { cn } from '../../lib/cn'

/** Ảnh hạng chuẩn: `public/images/icons/ui/place_{1,2,3}.png` (64×40) */
const PLACE_RANK_IMAGE_SRC: Record<1 | 2 | 3, string> = {
  1: '/images/icons/ui/place_1.png',
  2: '/images/icons/ui/place_2.png',
  3: '/images/icons/ui/place_3.png',
}

export interface PlaceBadgeProps {
  /** Chỉ số hàng trong bảng (0 = hạng 1) */
  rankIndex: number
  /** Ảnh từ API — nếu lỗi tải sẽ thử PNG local, cuối cùng là số */
  placeImg?: string
  className?: string
}

/**
 * Huy chương / hạng trong bảng Daily Challenge.
 * Ưu tiên: `placeImg` (CMS) → PNG `place_1|2|3` → vòng tròn có số.
 */
export const PlaceBadge: React.FC<PlaceBadgeProps> = ({ rankIndex, placeImg, className }) => {
  const place = rankIndex + 1
  const remote = placeImg?.trim()
  const localPng = place >= 1 && place <= 3 ? PLACE_RANK_IMAGE_SRC[place as 1 | 2 | 3] : undefined

  const [mode, setMode] = React.useState<'remote' | 'local' | 'text'>(() => {
    if (remote) return 'remote'
    if (localPng) return 'local'
    return 'text'
  })

  React.useEffect(() => {
    if (remote) setMode('remote')
    else if (localPng) setMode('local')
    else setMode('text')
  }, [remote, localPng])

  const src = mode === 'remote' && remote ? remote : mode === 'local' && localPng ? localPng : undefined

  if (mode === 'text' || !src) {
    return (
      <div
        className={cn(
          'table_rank',
          place <= 3 ? `rank_${place}` : 'table_rank--num',
          className
        )}
      >
        {place}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={`Rank ${place}`}
      width={64}
      height={40}
      className={cn('table_rank_img mx-auto block object-contain', className)}
      loading="lazy"
      decoding="async"
      onError={() => {
        if (mode === 'remote' && localPng) setMode('local')
        else setMode('text')
      }}
    />
  )
}

export default PlaceBadge
