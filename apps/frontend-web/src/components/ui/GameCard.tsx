import * as React from 'react'
import { cn } from '../../lib/cn'

export type GameCornerBadge = string | React.ReactNode

export interface GameCardProps {
  image: string
  title?: string
  cornerBadge?: GameCornerBadge
  variant?: 'lobby' | 'grid'
  className?: string
  onClick?: () => void
}

export const GameCard: React.FC<GameCardProps> = ({
  image,
  title,
  cornerBadge,
  className,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={cn('relative rounded-xl overflow-hidden cursor-pointer group bg-white/5 border border-white/10', className)}
    >
      <img src={image} alt={title || ''} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
      {cornerBadge && (
        <div className="absolute top-1 right-1 bg-amber-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded">
          {cornerBadge}
        </div>
      )}
      {title && (
        <div className="absolute bottom-0 inset-x-0 bg-black/60 p-1.5 text-xs text-white truncate text-center">
          {title}
        </div>
      )}
    </div>
  )
}

export default GameCard
