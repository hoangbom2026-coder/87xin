import * as React from 'react'
import { Link } from 'react-router-dom'
import PageLayout from '../../components/ui/PageLayout'
import PolicyDocumentLayout from '../../components/layout/PolicyDocumentLayout'
import ContentSection from '../../components/ui/ContentSection'
import { useLanguage } from '../../i18n/LanguageContext'
import { PAGE_PROSE_BODY_CLASS } from '../../constants/pageShell'
import { PUBLIC_IMAGES } from '../../constants/publicAssets'
import { HELP_LINKS_GRID_CLASS } from '../../constants/layoutGrids'

const HelpCenter: React.FC = () => {
  const { t } = useLanguage()

  const links = [
    { to: '/about', label: t('help.link.about', 'Giới thiệu') },
    { to: '/terms', label: t('help.link.terms', 'Điều khoản') },
    { to: '/privacy', label: t('help.link.privacy', 'Bảo mật') },
    { to: '/responsible-gaming', label: t('help.link.rg', 'Chơi có trách nhiệm') },
    { to: '/contact', label: t('help.link.contact', 'Liên hệ') },
  ]

  return (
    <PageLayout>
      <PolicyDocumentLayout
        title={t('help.title', 'TRUNG TÂM')}
        highlight={t('help.highlight', 'TRỢ GIÚP')}
        subtitle={t('help.subtitle', 'Câu hỏi thường gặp và liên kết nhanh tới tài liệu chính sách.')}
        icon={PUBLIC_IMAGES.policy.document}
      >
        <ContentSection title={t('help.faq.title', 'Bắt đầu')}>
          <p className={`${PAGE_PROSE_BODY_CLASS} mb-6`}>
            {t('help.faq.p', 'Nạp/rút: vào mục Tài khoản. Khuyến mãi: trang Khuyến mãi. Vấn đề kỹ thuật: thử làm mới trình duyệt hoặc xóa cache.')}
          </p>
          <nav aria-label={t('help.nav.policies', 'Tài liệu')}>
            <ul className={HELP_LINKS_GRID_CLASS}>
              {links.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="block rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-bold uppercase tracking-wide text-primary transition hover:border-primary/40"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </ContentSection>
      </PolicyDocumentLayout>
    </PageLayout>
  )
}

export default HelpCenter
