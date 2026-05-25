import * as React from 'react'
import GameCard from '../ui/GameCard'
import type { GameListProps } from '../../types'
import { cn } from '../../lib/cn'

export type { GameListProps }

/**
 * Danh sách game Set52 — thẻ `w-[120px]`, tỉ lệ 3/4, badge local.
 * Ảnh: `/images/games/*` (tên file từ `homeData`).
 */
const GameList: React.FC<GameListProps> = ({ games, cornerBadge = null, className, asRow = true }) => {
  const slides = Array.isArray(games) ? games : []
  if (!slides.length) return null

  const inner = slides.map((img, i) => (
    <GameCard
      key={`${img}-${i}`}
      image={img}
      cornerBadge={cornerBadge}
      variant="lobby"
      className="w-[120px] shrink-0 flex-none"
    />
  ))

  if (!asRow) {
    return <div className={cn('game-list-grid', className)}>{inner}</div>
  }

  return (
    <div
      className={cn(
        'game-list-row flex gap-2.5 overflow-x-auto scrollbar-hide px-1 pb-1',
        className,
      )}
    >
      {inner}
    </div>
  )
}

export default GameList
