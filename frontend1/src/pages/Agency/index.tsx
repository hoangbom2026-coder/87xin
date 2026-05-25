import * as React from 'react'
import { useNavigate, Link } from 'react-router-dom'
import PageLayout from '../../components/ui/PageLayout'
import ContentSection from '../../components/ui/ContentSection'
import AgencyOverview from '../../features/agency/components/AgencyOverview'
import { useLanguage } from '../../i18n/LanguageContext'
import { agencyFaqEn, agencyFaqVi } from '../../i18n/agencyFaq'
import { useSite } from '../../hooks/useSite'
import {
  AGENCY_LP_SECTION_STACK_CLASS,
  MARKETING_BENEFIT_CARD_MEDIA_CLASS,
  MARKETING_GRID_AGENCY_BENEFITS_4_CLASS,
  MARKETING_HERO_AGENCY_PRIMARY_IMG_CLASS,
  MARKETING_LP_SHELL_CLASS,
  MARKETING_MAX_WIDTH_CLASS,
  MARKETING_PAGE_GUTTER_X_CLASS,
  MARKETING_PAGE_TAIL_CLASS,
  PAGE_PROSE_BODY_CLASS,
  PAGE_PROSE_BODY_SM_CLASS,
} from '../../constants/pageShell'
import { FIN } from '../../constants/financialUi'
import { cn } from '../../lib/cn'
import { PUBLIC_IMAGES } from '../../constants/publicAssets'
import { StableImg } from '../../components/ui/StableImg'
import Button from '../../components/ui/Button'

const Agency: React.FC = () => {
  const { t, language } = useLanguage()
  const navigate = useNavigate()
  const { siteData } = useSite()
  const headingId = React.useId()
  const siteName = (siteData?.site?.siteName || '87').trim()

  const faqExtended = React.useMemo(() => {
    const src = language === 'vi' ? agencyFaqVi : agencyFaqEn
    const apply = (s: string) => s.replace(/\{\{brand\}\}/g, siteName)
    return ([1, 2, 3, 4, 5, 6, 7] as const).map((i) => {
      const qk = `agency.faq${i}q` as keyof typeof agencyFaqVi
      const ak = `agency.faq${i}a` as keyof typeof agencyFaqVi
      return { q: apply(src[qk] ?? ''), a: apply(src[ak] ?? '') }
    })
  }, [language, siteName])

  const benefitItems = React.useMemo(
    () =>
      [
        {
          image: PUBLIC_IMAGES.marketing.icons.benefit1,
          title: t('agency.benefit.networkTitle', 'Mạng lưới & downline'),
          desc: t(
            'agency.benefit.networkDesc',
            'Theo dõi thành viên giới thiệu, doanh thu và hiệu suất từng tầng.',
          ),
        },
        {
          image: PUBLIC_IMAGES.marketing.icons.benefit2,
          title: t('agency.benefit.reportTitle', 'Báo cáo minh bạch'),
          desc: t(
            'agency.benefit.reportDesc',
            'Bảng điều khiển tổng hợp hoa hồng, nạp rút và hoạt động theo chu kỳ.',
          ),
        },
        {
          image: PUBLIC_IMAGES.marketing.icons.benefit3,
          title: t('agency.benefit.secureTitle', 'Chính sách rõ ràng'),
          desc: t(
            'agency.benefit.secureDesc',
            'Quyền và nghĩa vụ đại lý được công bố; xử lý vi phạm nhất quán.',
          ),
        },
        {
          image: PUBLIC_IMAGES.marketing.icons.benefit4,
          title: t('agency.benefit.supportTitle', 'Đồng hành vận hành'),
          desc: t(
            'agency.benefit.supportDesc',
            'Account manager hỗ trợ onboarding, đào tạo và xử lý sự cố.',
          ),
        },
      ] as const,
    [t],
  )

  return (
    <PageLayout>
      <article
        className={cn(
          'agency-lp-page agency-lp-container w-full min-w-0 overflow-x-hidden',
          MARKETING_MAX_WIDTH_CLASS,
          MARKETING_PAGE_GUTTER_X_CLASS,
          MARKETING_PAGE_TAIL_CLASS,
        )}
        aria-labelledby={headingId}
      >
        <div className={cn(MARKETING_LP_SHELL_CLASS, AGENCY_LP_SECTION_STACK_CLASS, 'agency-lp-shell')}>
          <figure className="agency-lp-hero marketing-page-hero relative mb-2 w-full min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-page-surface/30 shadow-[var(--card-elev-shadow)] backdrop-blur-[2px]">
            <StableImg
              src={PUBLIC_IMAGES.marketing.agencyHero}
              alt=""
              width={1200}
              height={400}
              className={MARKETING_HERO_AGENCY_PRIMARY_IMG_CLASS}
              sizes="(max-width: 768px) 100vw, min(96vw, 1200px)"
              loading="eager"
              fetchPriority="high"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-secondary-darker/95 via-secondary-darker/45 to-transparent"
              aria-hidden
            />
            <div className="absolute inset-x-0 bottom-0 z-[1] p-5 md:p-8">
              <h1
                id={headingId}
                className="text-balance font-black uppercase tracking-tight text-white text-[clamp(1.5rem,4.5vw,2.75rem)] leading-tight drop-shadow-[0_4px_28px_rgba(0,0,0,0.9)]"
              >
                {t('agency.title', 'ĐẠI LÝ')}{' '}
                <span className="text-primary drop-shadow-[0_0_22px_rgba(0,123,255,0.45)]">
                  {t('agency.highlight', 'ĐỐI TÁC')}
                </span>
              </h1>
              <p className={cn(PAGE_PROSE_BODY_CLASS, 'mt-2 max-w-xl text-white/85')}>
                {t(
                  'agency.heroSubtitle',
                  'Mở rộng mạng lưới, dashboard minh bạch và đồng hành cùng account manager khi vận hành đại lý chính thức.',
                )}
              </p>
            </div>
            <figcaption className="sr-only">{t('agency.heroCaption', 'Banner chương trình đại lý')}</figcaption>
          </figure>

          <ContentSection title={t('agency.introTitle', 'Giới thiệu chương trình')} glow>
            <p className={PAGE_PROSE_BODY_CLASS}>
              {t(
                'agency.introP1',
                'Chương trình đại lý dành cho đối tác muốn xây dựng hệ thống giới thiệu có quy mô, có quy trình duyệt hồ sơ và kênh hỗ trợ riêng — phù hợp khi bạn cần báo cáo theo chu kỳ và đối soát hoa hồng rõ ràng.',
              )}
            </p>
            <p className={cn(PAGE_PROSE_BODY_CLASS, 'mt-4')}>
              {t(
                'agency.introP2',
                'Phần dưới trang gồm quyền lợi có minh họa, quy trình 3 bước, hình trang trí và chính sách tối thiểu. Để mở tài khoản đại lý hoặc báo giá theo vùng, hãy liên hệ qua nút ở cuối trang.',
              )}
            </p>
            <ul className={cn(PAGE_PROSE_BODY_CLASS, 'mt-4 list-none space-y-2 border-t border-white/[0.06] pt-4 text-text-muted')}>
              <li className="flex gap-2 text-balance">
                <span className="text-primary" aria-hidden>
                  •
                </span>
                {t(
                  'agency.introBullet1',
                  'Dashboard theo dõi downline, nạp rút và hiệu suất — hỗ trợ ra quyết định vận hành.',
                )}
              </li>
              <li className="flex gap-2 text-balance">
                <span className="text-primary" aria-hidden>
                  •
                </span>
                {t(
                  'agency.introBullet2',
                  'Chính sách và điều khoản công khai; vi phạm quảng bá hoặc thao túng tài khoản bị xử lý nghiêm.',
                )}
              </li>
            </ul>
          </ContentSection>

          <ContentSection title={t('agency.benefits.title', 'Quyền lợi hợp tác')} accent>
            <p className={cn(PAGE_PROSE_BODY_CLASS, 'mb-6')}>
              {t(
                'agency.benefits.lead',
                'Tóm tắt các trụ cột khi hợp tác đại lý với chúng tôi — chi tiết vận hành sẽ được account manager trao đổi sau khi duyệt hồ sơ.',
              )}
            </p>
            <div className={MARKETING_GRID_AGENCY_BENEFITS_4_CLASS}>
              {benefitItems.map(({ image, title, desc }) => (
                <div
                  key={title}
                  className={cn(
                    'group flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-white/10',
                    'bg-gradient-to-b from-white/[0.07] to-bg-surface/90 shadow-[0_10px_40px_rgba(0,0,0,0.42)] backdrop-blur-md',
                    'transition-all duration-300 ease-out will-change-transform',
                    'hover:z-[1] hover:scale-[1.02] hover:border-primary/40 hover:shadow-[0_14px_48px_rgba(0,0,0,0.55),0_0_28px_rgba(0,123,255,0.12)]',
                    'motion-reduce:hover:scale-100',
                  )}
                >
                  <div className={MARKETING_BENEFIT_CARD_MEDIA_CLASS}>
                    <StableImg
                      src={image}
                      alt=""
                      width={480}
                      height={200}
                      className={cn(
                        'h-full w-full object-contain object-center transition-transform duration-300 group-hover:scale-[1.03]',
                        FIN.canvasDark,
                      )}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                    <div
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg-main/95 via-bg-main/25 to-transparent"
                      aria-hidden
                    />
                  </div>
                  <div className="flex flex-col gap-2 border-t border-white/[0.06] p-[clamp(1rem,2.5vw,1.35rem)]">
                    <h3 className="font-black uppercase tracking-tight text-white text-[clamp(0.9375rem,1.8vw,1.0625rem)]">
                      {title}
                    </h3>
                    <p className="text-text-muted text-[clamp(0.8125rem,1.5vw,0.875rem)] font-medium leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ContentSection>

          <ContentSection title={t('agency.eligible.title', 'Đối tượng phù hợp')} glow>
            <p className={cn(PAGE_PROSE_BODY_CLASS, 'mb-4')}>
              {t(
                'agency.eligible.lead',
                'Chương trình phù hợp nếu bạn có kênh truyền thông ổn định, tuân thủ pháp lý khu vực và sẵn sàng vận hành minh bạch với người chơi.',
              )}
            </p>
            <ul className={cn(PAGE_PROSE_BODY_CLASS, 'list-disc space-y-2 pl-5')}>
              <li>{t('agency.eligible.1', 'Có traffic hoặc cộng đồng người chơi; cam kết không spam / không hứa lợi nhuận ảo.')}</li>
              <li>{t('agency.eligible.2', 'Chấp nhận quy trình duyệt, cung cấp thông tin liên hệ và kênh quảng bá thật.')}</li>
              <li>{t('agency.eligible.3', 'Đồng ý tuân thủ chính sách thương hiệu và điều khoản đại lý cập nhật trên hệ thống.')}</li>
            </ul>
          </ContentSection>

          <ContentSection title={t('agency.model.title', 'Mô hình hợp tác')}>
            <p className={cn(PAGE_PROSE_BODY_CLASS, 'mb-4')}>
              {t(
                'agency.model.lead',
                'Luồng tổng quát: đăng ký → vận hành downline → đối soát hoa hồng. Ngay sau đây là quy trình chi tiết, hình minh họa và chính sách tối thiểu.',
              )}
            </p>
            <ul className={cn(PAGE_PROSE_BODY_CLASS, 'list-disc space-y-2 pl-5')}>
              <li>{t('agency.model.1', 'Đăng ký đại lý, duyệt hồ sơ và nhận mã giới thiệu / link riêng.')}</li>
              <li>{t('agency.model.2', 'Theo dõi doanh thu downline, hoa hồng và báo cáo theo chu kỳ.')}</li>
              <li>{t('agency.model.3', 'Hỗ trợ vận hành, đào tạo và kênh liên hệ account manager.')}</li>
            </ul>
          </ContentSection>

          <section className="agency-lp-section min-w-0">
            <AgencyOverview siteName={siteName} />
          </section>

          <ContentSection title={t('agency.commission.title', 'Cơ chế hoa hồng đa tầng')} glow>
            <div className="mb-[clamp(1.5rem,4vw,2.5rem)] text-center">
              <p className="mx-auto max-w-2xl text-balance text-[13px] font-medium leading-relaxed text-text-muted">
                {t(
                  'agency.commission.intro',
                  'Hệ thống trả thưởng kết hợp giữa hoa hồng giới thiệu trực tiếp và chia sẻ lợi nhuận từ lãi ròng của tuyến dưới, tạo nguồn thu nhập thụ động bền vững.',
                )}
              </p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead>
                    <tr className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-text-gray">
                      <th className="px-6 py-4">{t('agency.table.type', 'Loại thu nhập')}</th>
                      <th className="px-6 py-4">{t('agency.table.target', 'Đối tượng')}</th>
                      <th className="px-6 py-4 text-right">{t('agency.table.rate', 'Tỷ lệ hưởng')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    <tr className="group hover:bg-white/[0.02]">
                      <td className="px-6 py-4 font-bold text-white">{t('agency.table.direct', 'Hoa hồng trực tiếp')}</td>
                      <td className="px-6 py-4 text-text-muted">F1 (Đại lý cấp 1)</td>
                      <td className="px-6 py-4 text-right text-lg font-black italic text-primary">50%</td>
                    </tr>
                    <tr className="group hover:bg-white/[0.02]">
                      <td className="px-6 py-4 font-bold text-white">{t('agency.table.indirect', 'Hoa hồng gián tiếp')}</td>
                      <td className="px-6 py-4 text-text-muted">F2 → Fn (Đa tầng)</td>
                      <td className="px-6 py-4 text-right text-lg font-black italic text-primary">25% - 50%</td>
                    </tr>
                    <tr className="group hover:bg-white/[0.02]">
                      <td className="px-6 py-4 font-bold text-white">{t('agency.table.staking', 'Lãi trên lãi (Staking)')}</td>
                      <td className="px-6 py-4 text-text-muted">{t('agency.table.stakingDesc', 'Lợi nhuận từ lãi hằng ngày của toàn hệ thống')}</td>
                      <td className="px-6 py-4 text-right text-lg font-black italic text-primary">10% - 30%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <p className="mt-4 text-center text-[11px] italic text-text-gray">
              * {t('agency.table.note', 'Chi tiết % hoa hồng và điều kiện rút tiền được quy định cụ thể trong từng gói đầu tư.')}
            </p>
          </ContentSection>

          <ContentSection title={t('agency.related.title', 'Chương trình liên quan')} accent>
            <p className={PAGE_PROSE_BODY_CLASS}>
              {t(
                'agency.related.p',
                'Nếu bạn ưu tiên mô hình giới thiệu cá nhân, không cần duyệt đại lý đầy đủ — có thể xem chương trình Affiliate (link, hoa hồng và điều kiện riêng).',
              )}
            </p>
            <div className="mt-5">
              <Link
                to="/affiliate"
                className="text-sm font-black uppercase tracking-wide text-primary underline-offset-4 hover:underline"
              >
                {t('agency.related.ctaAffiliate', 'Đi tới trang Affiliate')}
              </Link>
            </div>
          </ContentSection>

          <ContentSection title={t('agency.faq.title', 'Câu hỏi thường gặp')} glow>
            <p className={cn(PAGE_PROSE_BODY_CLASS, 'mb-6')}>
              {t(
                'agency.faqExtendedLead',
                'Chi tiết mô hình Agency, lãi qua đêm và hoa hồng đa tầng — nội dung tham khảo; điều khoản cuối cùng theo thông báo trên hệ thống.',
              )}
            </p>
            <div className="min-w-0 space-y-3">
              {faqExtended.map((item, idx) => (
                <details
                  key={idx}
                  className="group rounded-[var(--radius-standard)] border border-fin-line/55 bg-fin-inset/45 open:border-primary/35 open:bg-fin-inset/60"
                >
                  <summary className="cursor-pointer list-none px-4 py-3.5 font-bold text-white marker:content-none [&::-webkit-details-marker]:hidden">
                    <span className="inline-flex w-full items-start justify-between gap-3 text-left text-[clamp(0.8125rem,1.6vw,0.9375rem)] leading-snug">
                      {item.q}
                      <span className="shrink-0 text-primary transition-transform group-open:rotate-180" aria-hidden>
                        ▼
                      </span>
                    </span>
                  </summary>
                  <div className="border-t border-white/[0.06] px-4 py-3 text-[clamp(0.75rem,1.4vw,0.8125rem)] leading-relaxed text-text-muted whitespace-pre-wrap">
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          </ContentSection>

          <ContentSection title={t('agency.support.title', 'Hỗ trợ & liên hệ')} glow>
            <p className={PAGE_PROSE_BODY_CLASS}>
              {t(
                'agency.support.p',
                'Đội ngũ account manager đồng hành onboarding, đào tạo sản phẩm và xử lý sự cố kỹ thuật.',
              )}
            </p>
            <p className={cn(PAGE_PROSE_BODY_CLASS, 'mt-4')}>
              {t(
                'agency.support.p2',
                'Bạn cũng có thể xem trung tâm trợ giúp cho câu hỏi chung, hoặc gửi yêu cầu mở đại lý qua form liên hệ.',
              )}
            </p>
            <div className="mt-8 flex flex-wrap items-stretch justify-start gap-3 sm:justify-center">
              <Button
                variant="primary"
                onClick={() => navigate('/contact')}
                className="inline-flex min-h-[44px] items-center justify-center px-6 text-sm font-black uppercase tracking-wide no-underline shadow-[0_0_22px_rgba(239,68,68,0.35)] hover:brightness-110"
              >
                {t('agency.cta.contact', 'Liên hệ mở đại lý')}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/help-center')}
                className="inline-flex min-h-[44px] items-center justify-center px-5 text-sm font-black uppercase tracking-wide no-underline shadow-[0_6px_24px_rgba(0,0,0,0.25)] backdrop-blur-sm hover:border-primary/45 hover:shadow-[0_0_20px_rgba(0,123,255,0.15)]"
              >
                {t('agency.cta.help', 'Trung tâm trợ giúp')}
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate('/terms')}
                className="inline-flex min-h-[44px] items-center justify-center px-5 text-sm font-black uppercase tracking-wide no-underline hover:border-white/20 hover:text-white"
              >
                {t('agency.cta.terms', 'Điều khoản')}
              </Button>
            </div>
            <p className={cn(PAGE_PROSE_BODY_SM_CLASS, 'mt-6 border-t border-white/[0.06] pt-4 text-center sm:text-left')}>
              {t(
                'agency.disclaimer',
                'Nội dung trang mang tính giới thiệu. Điều kiện hợp tác và hoa hồng áp dụng theo thông báo chính thức tại thời điểm ký kết / duyệt hồ sơ.',
              )}
            </p>
          </ContentSection>
        </div>
      </article>
    </PageLayout>
  )
}

export default Agency
