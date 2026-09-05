import * as React from 'react'
import PageLayout from '../../components/ui/PageLayout'
import PolicyDocumentLayout from '../../components/layout/PolicyDocumentLayout'
import ContentSection from '../../components/ui/ContentSection'
import { StableImg } from '../../components/ui/StableImg'
import { useLanguage } from '../../i18n/LanguageContext'
import { useSite } from '../../hooks/useSite'
import { applyBrand, getBrandName } from '../../lib/brand'
import { PUBLIC_IMAGES } from '../../constants/publicAssets'
import { cn } from '../../lib/cn'
import {
  MARKETING_LP_SHELL_CLASS,
  MARKETING_HERO_PRIMARY_IMG_CLASS,
  PAGE_PROSE_BODY_CLASS,
  MARKETING_SECTION_STACK_CLASS,
} from '../../constants/pageShell'

const AboutUs: React.FC = () => {
  const { t } = useLanguage()
  const { siteData } = useSite()
  const brand = getBrandName(siteData)

  const tb = React.useCallback(
    (key: string, fallback: string) => applyBrand(t(key, fallback), brand),
    [t, brand],
  )

  const titlePage = tb('about.mobilePageTitle', 'Giới thiệu về {{brand}}')
  const imgAlt = tb('about.heroImgAlt', 'Giới thiệu {{brand}}')

  return (
    <PageLayout>
      <PolicyDocumentLayout
        title={t('about.title', 'GIỚI THIỆU')}
        highlight={brand}
        subtitle={tb('about.heroLead', 'Nhà cái đẳng cấp Châu Âu {{brand}}')}
        icon={PUBLIC_IMAGES.policy.document}
      >
        <div className={cn(MARKETING_LP_SHELL_CLASS, MARKETING_SECTION_STACK_CLASS)}>
          <figure className="marketing-page-hero relative mb-2 w-full min-w-0 overflow-hidden rounded-2xl border border-fin-line/50 shadow-[var(--card-elev-shadow)]">
            <StableImg
              src={PUBLIC_IMAGES.faq.aboutUsMobile}
              alt={imgAlt}
              width={1200}
              height={400}
              className={MARKETING_HERO_PRIMARY_IMG_CLASS}
              sizes="(max-width: 768px) 100vw, min(96vw, 1200px)"
              loading="eager"
              fetchPriority="high"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-secondary-darker/95 via-secondary-darker/45 to-transparent"
              aria-hidden
            />
            <div className="absolute inset-x-0 bottom-0 z-[1] p-5 md:p-8">
              <h1 className="text-balance font-black uppercase tracking-tight text-white text-[clamp(1.25rem,4vw,2.25rem)] leading-tight">
                {titlePage}
              </h1>
              <p className={cn(PAGE_PROSE_BODY_CLASS, 'mt-2 max-w-xl text-white/85')}>
                {tb('about.heroLead', 'Nhà cái đẳng cấp Châu Âu {{brand}}')}
              </p>
            </div>
          </figure>

          <ContentSection title={t('about.introTitle', 'Lịch sử & Sứ mệnh')} glow>
            <div className="space-y-4">
              <p className={PAGE_PROSE_BODY_CLASS}>{tb('about.intro.p1', '')}</p>
              <p className={PAGE_PROSE_BODY_CLASS}>{tb('about.intro.p2', '')}</p>
              <p className={PAGE_PROSE_BODY_CLASS}>{tb('about.intro.p3', '')}</p>
            </div>
          </ContentSection>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <ContentSection title={tb('about.s1.title', '1. Hợp pháp')} accent>
              <p className={PAGE_PROSE_BODY_CLASS}>{tb('about.s1.body', '')}</p>
            </ContentSection>

            <ContentSection title={tb('about.s2.title', '2. Cá cược công bằng')} accent>
              <p className={PAGE_PROSE_BODY_CLASS}>{tb('about.s2.body', '')}</p>
            </ContentSection>

            <ContentSection title={tb('about.s3.title', '3. Nạp – Rút nhanh chóng')} accent>
              <p className={PAGE_PROSE_BODY_CLASS}>{tb('about.s3.body', '')}</p>
            </ContentSection>

            <ContentSection title={tb('about.s4.title', '4. Nền tảng bảo mật')} accent>
              <p className={PAGE_PROSE_BODY_CLASS}>{tb('about.s4.body', '')}</p>
            </ContentSection>
          </div>

          <ContentSection title={tb('about.s5.title', '5. Đội ngũ nhân viên chuyên nghiệp')} glow>
            <p className={PAGE_PROSE_BODY_CLASS}>{tb('about.s5.body', '')}</p>
          </ContentSection>

          <ContentSection title={t('about.commitment.title', 'Cam kết của chúng tôi')} accent>
            <ul className={cn(PAGE_PROSE_BODY_CLASS, 'list-none space-y-3')}>
              <li className="flex gap-3 rounded-xl border border-fin-line/50 bg-fin-inset/40 px-4 py-3">
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
                <span>{t('about.commitment.1', 'Luôn đặt quyền lợi và sự an toàn của người chơi lên hàng đầu.')}</span>
              </li>
              <li className="flex gap-3 rounded-xl border border-fin-line/50 bg-fin-inset/40 px-4 py-3">
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
                <span>{t('about.commitment.2', 'Cung cấp tỷ lệ kèo cạnh tranh và đa dạng nhất thị trường.')}</span>
              </li>
              <li className="flex gap-3 rounded-xl border border-fin-line/50 bg-fin-inset/40 px-4 py-3">
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
                <span>{t('about.commitment.3', 'Liên tục cập nhật công nghệ mới nhất để bảo vệ dữ liệu khách hàng.')}</span>
              </li>
            </ul>
          </ContentSection>
        </div>
      </PolicyDocumentLayout>
    </PageLayout>
  )
}

export default AboutUs
