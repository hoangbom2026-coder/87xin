import * as React from 'react'
import { cn } from '../../lib/cn'

interface VipProgressBarProps {
  currentTier: number
  tierName: string
  progress: number // 0 to 100
  currentBet: number
  targetBet: number
  className?: string
}

export const VipProgressBar: React.FC<VipProgressBarProps> = ({
  currentTier,
  tierName,
  progress,
  currentBet,
  targetBet,
  className,
}) => {
  return (
    <div className={cn('fin-panel p-4 rounded-xl border border-white/5 bg-white/[0.03]', className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center font-black text-white shadow-lg shadow-primary/20">
            {currentTier}
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-text-gray font-black">Cấp độ hiện tại</div>
            <div className="text-sm font-black text-white uppercase tracking-wide">{tierName}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-widest text-text-gray font-black">Tiến độ</div>
          <div className="text-sm font-black text-primary">{Math.round(progress)}%</div>
        </div>
      </div>

      <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-gradient-to-r from-primary to-blue-400 transition-all duration-1000 ease-out"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      <div className="flex justify-between text-[10px] font-bold text-text-gray uppercase tracking-wider">
        <span>{currentBet.toLocaleString()} đ</span>
        <span>{targetBet.toLocaleString()} đ</span>
      </div>
    </div>
  )
}
