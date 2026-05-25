import * as React from 'react'
import { useLanguage } from '../../../i18n/LanguageContext'
import { FOOTER_TRUST_BADGES } from '../footerNavConfig'
import { footerLicenseUrl } from '../../../utils/publicImagePath'
import { footerLogoUrl } from '../../../constants/providerFooterLogos'

const FooterTrustBadges: React.FC = () => {
  const { t } = useLanguage()

  return (
    <div
      className="flex flex-wrap items-center justify-center gap-6 border-y border-white/5 py-10 md:gap-10 md:py-12"
      role="list"
      aria-label={t('footer.trustBadges', 'Đối tác & giấy phép')}
    >
      {FOOTER_TRUST_BADGES.map((name) => (
        <img
          key={name}
          role="listitem"
          src={name.startsWith('l-') ? footerLicenseUrl(name) : footerLogoUrl(`${name}.png`)}
          alt={name.replace(/-/g, ' ')}
          width={name.startsWith('l-') ? 70 : 80}
          height={24}
          className="h-6 cursor-pointer object-contain opacity-30 grayscale transition-all duration-500 hover:opacity-80 hover:grayscale-0"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            if (!name.startsWith('l-')) e.currentTarget.style.display = 'none'
          }}
        />
      ))}
    </div>
  )
}

export default FooterTrustBadges
