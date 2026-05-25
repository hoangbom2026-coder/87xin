import * as React from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../../i18n/LanguageContext'
import type { FooterNavColumn } from '../footerNavConfig'
import { FOOTER_HEADING_CLASS, FOOTER_LINK_CLASS } from './footerUi'

interface FooterNavSectionProps {
  column: FooterNavColumn
}

const FooterNavSection: React.FC<FooterNavSectionProps> = ({ column }) => {
  const { t } = useLanguage()
  const headingId = `footer-nav-${column.id}`
  const navLabel = t(column.titleKey, column.titleFb)

  return (
    <nav className="space-y-4 sm:space-y-5" aria-labelledby={headingId}>
      <h4 id={headingId} className={FOOTER_HEADING_CLASS}>
        {navLabel}
      </h4>
      <ul className="m-0 list-none space-y-2 p-0 sm:space-y-3">
        {column.links.map((l) => (
          <li key={l.id}>
            <Link to={l.to} className={FOOTER_LINK_CLASS}>
              <span
                className="h-[1px] w-1.5 shrink-0 bg-primary/0 transition-all duration-300 group-hover:w-3 group-hover:bg-primary"
                aria-hidden
              />
              {t(l.i18nKey, l.fallback)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default FooterNavSection
