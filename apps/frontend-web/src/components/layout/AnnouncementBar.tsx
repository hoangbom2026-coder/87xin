import * as React from 'react'
import { Megaphone } from 'lucide-react'
import { useSite } from '../../hooks/useSite'
import { useLanguage } from '../../i18n/LanguageContext'

const AnnouncementBar: React.FC = () => {
  const { t } = useLanguage()
  const { siteData } = useSite()
  const announcement = siteData?.site?.announcement

  if (!announcement) return null

  return (
    <div className="announcement_strip bg-bg-main border-b border-white/5 h-[42px] flex items-center overflow-hidden relative z-50">
      <div className="container flex items-center h-full">
        <div className="flex items-center gap-2 text-accent-red shrink-0 px-3 h-full bg-white/5 border-r border-white/5">
          <Megaphone size={14} className="animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest">
            {t('common.notice', 'Notice')}
          </span>
        </div>
        
        <div className="flex-1 overflow-hidden h-full flex items-center pl-4">
          <div className="whitespace-nowrap inline-block animate-marquee hover:[animation-play-state:paused] text-[11px] font-bold text-slate-300 tracking-wide cursor-default uppercase">
            {announcement}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnnouncementBar
