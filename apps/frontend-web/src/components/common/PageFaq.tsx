import * as React from 'react'
import { useState, useEffect, useMemo } from 'react'
import { ChevronDown } from 'lucide-react'
import { getPageFaqs, FaqItem } from '../../services/siteService'
import { useLanguage } from '../../i18n/LanguageContext'
import { cn } from '../../lib/cn'

interface PageFaqProps {
  category: string
  title?: string
  className?: string
}

const FAQ_KEYS: Record<string, string[]> = {
  default: ['deposit', 'withdraw', 'transfer', 'forgot_password'],
  agency: ['program', 'commission', 'tree', 'commission_withdraw', 'level_up'],
  voucher: ['deposit', 'withdraw', 'transfer', 'forgot_password'],
  inbox: ['deposit', 'withdraw', 'transfer', 'forgot_password'],
}

const PageFaq: React.FC<PageFaqProps> = ({ category, title, className }) => {
  const { t } = useLanguage()
  const [faqs, setFaqs] = useState<FaqItem[]>([])
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [loading, setLoading] = useState(true)

  const localFaqs: FaqItem[] = useMemo(() => {
    const keys = FAQ_KEYS[category] || FAQ_KEYS.default
    return keys.map((k, i) => ({
      id: String(i + 1),
      question: t(`faq.${category}.${k}.q`, t(`faq.default.${k}.q`, k)),
      answer: t(`faq.${category}.${k}.a`, t(`faq.default.${k}.a`, '')),
    }))
  }, [category, t])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const data: any = await getPageFaqs(category)
        const list = Array.isArray(data) ? data : (data?.data || [])
        setFaqs(list.length > 0 ? list : localFaqs)
      } catch {
        setFaqs(localFaqs)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [category, localFaqs])

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    )
  }

  if (faqs.length === 0) return null

  return (
    <div className={cn('space-y-4', className)}>
      <div className="text-lg font-black uppercase tracking-widest text-primary mb-6">
        {title || t('common.faq', 'Frequently Asked Questions')}
      </div>
      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
            <button
              type="button"
              className={cn(
                'flex w-full items-center justify-between px-5 py-4 text-left transition-all hover:bg-white/[0.05]',
                openFaq === i ? 'text-primary' : 'text-white'
              )}
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
            >
              <span className="flex-1 font-bold text-[13px]">{faq.question}</span>
              <ChevronDown className={cn('w-4 h-4 transition-transform duration-300', openFaq === i && 'rotate-180')} />
            </button>
            <div
              className={cn(
                'overflow-hidden transition-all duration-300',
                openFaq === i ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
              )}
            >
              <div className="px-5 pb-5 text-[13px] leading-relaxed text-slate-400 border-t border-white/5 pt-4">
                {faq.answer}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PageFaq
