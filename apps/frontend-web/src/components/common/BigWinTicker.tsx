import * as React from 'react'
import { useLanguage } from '../../i18n/LanguageContext'
import { cn } from '../../lib/cn'

interface WinData {
  player: string
  amount: string
  game: string
}

const WINS: WinData[] = [
  { player: 'nguyen***', amount: '8,800,000 đ', game: 'Slots' },
  { player: 'tran***', amount: '12,500,000 đ', game: 'Live Casino' },
  { player: 'le***', amount: '5,200,000 đ', game: 'Thể thao' },
  { player: 'pham***', amount: '20,000,000 đ', game: 'Bắn cá' },
  { player: 'hoang***', amount: '15,000,000 đ', game: 'Lô đề' },
]

/** Live win strip — `.big-win-ticker` (full width trên bottom nav mobile) */
export const BigWinTicker: React.FC<{ className?: string }> = ({ className }) => {
  const { t } = useLanguage()
  const [index, setIndex] = React.useState(0)

  React.useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % WINS.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [])

  const win = WINS[index]

  return (
    <div
      className={cn('big-win-ticker fixed z-[104] max-lg:bottom-[72px]', className)}
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="big-win-ticker__inner flex items-center gap-3">
        <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-accent-red/30 bg-accent-red/20 px-2 py-0.5">
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-red" />
          <span className="text-[9px] font-black uppercase tracking-widest text-accent-red">{t('common.live', 'Live')}</span>
        </div>
        <p className="min-w-0 truncate text-[11px] font-bold text-white/90">
          <span className="big-win-ticker__player">{win.player}</span>
          <span className="mx-1 font-medium text-white/40">{t('common.justWon', 'vừa thắng')}</span>
          <span className="big-win-ticker__amount">{win.amount}</span>
          <span className="ml-1 font-medium italic text-white/40">{t('common.atGame', 'tại')} {win.game}</span>
        </p>
      </div>
    </div>
  )
}
