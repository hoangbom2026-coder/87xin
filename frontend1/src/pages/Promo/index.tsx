import * as React from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageLayout from '../../components/ui/PageLayout'
import { useLanguage } from '../../i18n/LanguageContext'
import { cn } from '../../lib/cn'

const FILTERS = ['All', 'Casino', 'Sports', 'Slots', 'Fishing'] as const

const PROMO_ITEMS = [
  { title: 'Siêu Hoàn Trả Casino', img: '/images/banners/live-casino/live.webp', cat: 'Casino' },
  { title: 'Thưởng Nạp Thể Thao', img: '/images/banners/home/sports.webp', cat: 'Sports' },
  { title: 'Bắn Cá Xả Láng', img: '/images/banners/fishing/fishing.webp', cat: 'Fishing' },
  { title: 'Đua Top Slots', img: '/images/banners/slots/slots.webp', cat: 'Slots' },
] as const

const Promo: React.FC = () => {
  const { t } = useLanguage()
  const [filter, setFilter] = useState<string>('All')

  const list = PROMO_ITEMS.filter((p) => filter === 'All' || p.cat === filter)

  return (
    <PageLayout mainClassName="promo-page min-h-screen bg-brand pb-24" containerClassName="max-lg:px-0 max-lg:py-0">
      <div className="sticky top-0 z-10 border-b border-gray-800 bg-brand-surface px-4 pb-2 pt-4">
        <h1 className="mb-4 text-center text-lg font-bold text-white">
          {t('promo.pageTitle', 'Khuyến Mãi')}
        </h1>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide">
          {FILTERS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={cn(
                'whitespace-nowrap border-b-2 pb-2 text-sm font-bold transition-colors',
                filter === tab
                  ? 'border-brand-red text-brand-red'
                  : 'border-transparent text-gray-500',
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 p-4">
        {list.map((p) => (
          <article
            key={p.title}
            className="overflow-hidden rounded-xl border border-gray-800 bg-brand-surface shadow-lg"
          >
            <img src={p.img} alt="" className="h-[140px] w-full object-cover" loading="lazy" />
            <div className="flex items-center justify-between p-3">
              <h3 className="text-sm font-bold text-white">{p.title}</h3>
              <Link
                to="/promotions"
                className="rounded bg-brand-blue px-3 py-1 text-xs font-bold text-white"
              >
                {t('promo.join', 'Tham Gia')}
              </Link>
            </div>
          </article>
        ))}
      </div>
    </PageLayout>
  )
}

export default Promo
