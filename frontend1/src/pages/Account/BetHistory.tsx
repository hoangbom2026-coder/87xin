import * as React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { ChevronDown, Loader, ExternalLink } from 'lucide-react'
import Button from '../../components/ui/Button'
import type { RootState } from '../../store'
import { useLanguage } from '../../i18n/LanguageContext'
import { useCurrency } from '../../hooks/useCurrency'
import AccountFinancialShell from '../../components/layout/AccountFinancialShell'
import SubHeader from '../../components/common/SubHeader'
import { cn } from '../../lib/cn'
import { ACCOUNT_VIEW_FADE_CLASS } from '../../constants/pageShell'
import { getWagerList, getGameHistory } from '../../services/gameService'
import EmptyState from '../../components/ui/EmptyState'
import AccountAuthPrompt from '../../components/account/AccountAuthPrompt'
import { FIN } from '../../constants/financialUi'

type TimeFilter = '24h' | '7d' | '30d' | 'all'
type BetResultTab = '' | 'win' | 'draw' | 'lose' | 'cancel' | 'pending'

function fmtDate(ms?: number) {
  if (!ms) return '—';
  try {
    return new Date(ms).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return String(ms);
  }
}

const BetHistory: React.FC = () => {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { token } = useSelector((s: RootState) => s.auth)
  const { formatBalance } = useCurrency()
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('24h')
  const [resultTab, setResultTab] = useState<BetResultTab>('')
  const [wagers, setWagers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const buildTimeRange = useCallback(() => {
    const end = Date.now()
    let start = end
    if (timeFilter === '24h') start -= 24 * 60 * 60 * 1000
    else if (timeFilter === '7d') start -= 7 * 24 * 60 * 60 * 1000
    else if (timeFilter === '30d') start -= 30 * 24 * 60 * 60 * 1000
    else start = 0
    return { start, end }
  }, [timeFilter])

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    const { start, end } = buildTimeRange()
    try {
      const res = await getWagerList({ start, end, size: 50 })
      if (res.success) {
        setWagers(res.data?.wagers || res.data || [])
      }
    } catch (err) {
      console.error('Failed to load wagers', err)
    } finally {
      setLoading(false)
    }
  }, [token, buildTimeRange])

  useEffect(() => {
    void load()
  }, [load])

  const handleViewHistory = async (code: string) => {
    try {
      const res = await getGameHistory(code)
      if (res.success && res.data?.content) {
        if (res.data.content.startsWith('http')) {
          window.open(res.data.content, '_blank')
        } else {
          const win = window.open('', '_blank')
          win?.document.write(res.data.content)
          win?.document.close()
        }
      }
    } catch (err) {
      console.error('Failed to get game history', err)
    }
  }

  if (!token) {
    return (
      <AccountFinancialShell
        accountTitle={t('history.betting', 'Lịch sử cá cược')}
        accountDescription={t('account.desc.betHistory', 'Theo dõi các phiên cá cược gần đây.')}
        activeTab="history"
        hideBanner
      >
        <AccountAuthPrompt />
      </AccountFinancialShell>
    )
  }

  const resultTabs: { value: BetResultTab; label: string }[] = [
    { value: '', label: t('history.bet.tabAll', 'Tất cả') },
    { value: 'win', label: t('history.bet.tabWin', 'Thắng') },
    { value: 'draw', label: t('history.bet.tabDraw', 'Hoà') },
    { value: 'lose', label: t('history.bet.tabLose', 'Thua') },
    { value: 'cancel', label: t('history.bet.tabCancel', 'Bị hủy') },
    { value: 'pending', label: t('history.bet.tabPending', 'Đang chờ') },
  ]

  const badgeClass = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('win') || s.includes('settled') || s.includes('thắng')) return 'bg-emerald-500/10 text-emerald-500';
    if (s.includes('pending') || s === 'bet' || s.includes('chờ')) return 'bg-orange-500/10 text-orange-500';
    if (s.includes('lose') || s.includes('cancel') || s.includes('thua') || s.includes('hủy')) return 'bg-red-500/10 text-red-400';
    return 'bg-fin-surface text-text-gray';
  };

  const filteredWagers = wagers.filter(w => {
    if (!resultTab) return true
    const s = w.status?.toLowerCase() || ''
    if (resultTab === 'win') return s.includes('win') || (w.prize_amount > 0)
    if (resultTab === 'lose') return s.includes('lose') || (w.prize_amount === 0 && s.includes('settled'))
    if (resultTab === 'pending') return s.includes('pending') || s === 'bet'
    return s.includes(resultTab)
  })

  return (
    <AccountFinancialShell
      accountTitle={t('history.betting', 'Lịch sử cá cược')}
      accountDescription={t('account.desc.betHistory', 'Theo dõi các phiên cá cược gần đây.')}
      activeTab="history"
      hideBanner
      subHeader={
        <SubHeader
          rightContent={
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-text-muted hover:bg-white/5 transition-colors"
              onClick={load}
              title={t('common.refresh', 'Làm mới')}
            >
              <Loader size={18} className={cn(loading && 'animate-spin')} />
            </button>
          }
        />
      }
    >
      <div className={cn('history-section betting-section space-y-5', ACCOUNT_VIEW_FADE_CLASS)}>

        {/* === Bộ lọc thời gian === */}
        <div className={cn('rounded-2xl p-4 sm:p-5', FIN.inset)}>
          <label
            htmlFor="bet-history-time"
            className="mb-2 block text-[11px] font-black uppercase tracking-widest text-text-gray"
          >
            {t('history.timeFilterLabel', 'Khoảng thời gian')}
          </label>
          <div className="relative">
            <select
              id="bet-history-time"
              className={cn(
                'w-full appearance-none rounded-xl border border-fin-line bg-fin-deep px-4 py-3 pr-10',
                'text-sm text-white outline-none transition-colors cursor-pointer',
                'focus:border-primary/50 focus:ring-1 focus:ring-primary/20',
              )}
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
            >
              <option value="24h">{t('history.24h', 'Chỉ hiển thị trong 24 giờ')}</option>
              <option value="7d">{t('history.7d', 'Chỉ hiển thị trong 7 ngày')}</option>
              <option value="30d">{t('history.30d', 'Chỉ hiển thị trong 30 ngày')}</option>
              <option value="all">{t('history.allTime', 'Hiển thị tất cả')}</option>
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-gray" />
          </div>
        </div>

        {/* === Tab lọc kết quả === */}
        <div role="tablist" className="overflow-hidden rounded-xl border border-fin-line bg-fin-deep/70">
          <div className="flex overflow-x-auto scrollbar-hide">
            {resultTabs.map((tab) => {
              const sel = resultTab === tab.value
              return (
                <Button
                  key={tab.value || 'all'}
                  variant="bare"
                  size="sm"
                  className={cn(
                    'relative min-h-[48px] flex-1 basis-0 border-0 bg-transparent px-1',
                    'text-[11px] font-bold uppercase tracking-[0.04em] transition-colors',
                    sel ? 'text-primary' : 'text-text-muted',
                  )}
                  onClick={() => setResultTab(tab.value)}
                >
                  <span className="relative z-[1] flex flex-col items-center justify-center gap-0.5 py-3">
                    {tab.label}
                    <span className={cn('h-0.5 w-8 rounded-full bg-primary transition-opacity', sel ? 'opacity-100' : 'opacity-0')} />
                  </span>
                </Button>
              )
            })}
          </div>
        </div>

        {/* === Bảng cá cược === */}
        <div className={cn('overflow-hidden rounded-2xl border border-fin-line', FIN.panel)}>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="bg-fin-deep text-primary border-b border-fin-line uppercase font-black tracking-widest">
                  <th className="px-4 py-3.5 text-left">{t('common.game', 'Trò chơi')}</th>
                  <th className="px-4 py-3.5 text-left">{t('common.date', 'Thời gian')}</th>
                  <th className="px-4 py-3.5 text-right">{t('common.bet', 'Tiền cược')}</th>
                  <th className="px-4 py-3.5 text-right">{t('common.payout', 'Tiền thắng')}</th>
                  <th className="px-4 py-3.5 text-center">{t('history.state', 'Trạng thái')}</th>
                  <th className="px-4 py-3.5 text-center">{t('common.action', 'Thao tác')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fin-line/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-text-gray text-xs font-bold">
                      <Loader className="inline animate-spin mr-2" size={16} />
                      {t('common.loading', 'Đang tải…')}
                    </td>
                  </tr>
                ) : filteredWagers.length === 0 ? (
                  <EmptyState
                    variant="cell"
                    colSpan={6}
                    title={t('history.bet.emptyTitle', 'Lịch sử cá cược của bạn đang trống')}
                    message={t('history.bet.emptyLine1', 'Hãy tham gia cược ngay hôm nay!')}
                  />
                ) : (
                  filteredWagers.map((w) => (
                    <tr key={w.code || w.id} className="hover:bg-fin-deep/70 transition-colors">
                      <td className="px-4 py-3.5 text-white font-bold">
                        <div className="flex flex-col">
                          <span>{w.game_code}</span>
                          <span className="text-[10px] text-text-gray font-normal">{w.game_type}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-text-gray">{fmtDate(w.created_at)}</td>
                      <td className="px-4 py-3.5 text-white text-right tabular-nums font-bold">{formatBalance(w.bet_amount)}</td>
                      <td className={cn('px-4 py-3.5 text-right tabular-nums font-bold', w.prize_amount > 0 ? 'text-emerald-500' : 'text-white')}>
                        {formatBalance(w.prize_amount)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={cn('inline-block px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider', badgeClass(w.status || ''))}>
                          {w.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <Button
                          variant="bare"
                          size="sm"
                          className="text-primary hover:text-primary/80"
                          onClick={() => handleViewHistory(w.code || w.id)}
                          title={t('common.view', 'Xem chi tiết')}
                        >
                          <ExternalLink size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AccountFinancialShell>
  )
}

export default BetHistory
