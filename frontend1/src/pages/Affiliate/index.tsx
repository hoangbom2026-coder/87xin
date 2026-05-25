import * as React from 'react'
import { Link } from 'react-router-dom'
import { Dice5, Ticket, Trophy, Tv, type LucideIcon } from 'lucide-react'
import PageLayout from '../../components/ui/PageLayout'
import ContentSection from '../../components/ui/ContentSection'
import { StableImg } from '../../components/ui/StableImg'
import Button from '../../components/ui/Button'
import AffiliateCommission from '../../features/affiliate/components/AffiliateCommission'
import { useLanguage } from '../../i18n/LanguageContext'
import { cn } from '../../lib/cn'
import { PUBLIC_IMAGES } from '../../constants/publicAssets'
import {
  MARKETING_HERO_PRIMARY_IMG_CLASS,
  MARKETING_HERO_SECONDARY_IMG_CLASS,
  MARKETING_LP_SHELL_CLASS,
  MARKETING_MAX_WIDTH_CLASS,
  MARKETING_PAGE_GUTTER_X_CLASS,
  MARKETING_PAGE_TAIL_CLASS,
  MARKETING_SECTION_STACK_CLASS,
  MARKETING_SHOWCASE_4UP_IMG_CLASS,
  PAGE_PROSE_BODY_CLASS,
} from '../../constants/pageShell'
import {
  commissionTiers,
  getAffiliateBenefits,
  getAffiliateSteps,
  getRecentCommissions,
} from '../../constants/affiliateData'

const Affiliate: React.FC = () => {
  const { t } = useLanguage()
  const headingId = React.useId()
  const steps = React.useMemo(() => getAffiliateSteps(t), [t])
  const benefits = React.useMemo(() => getAffiliateBenefits(t), [t])
  const recentRows = React.useMemo(() => getRecentCommissions(t), [t])

  const pillars = React.useMemo(
    () =>
      [
        {
          icon: PUBLIC_IMAGES.marketing.icons.pillar1,
          title: t('affiliate.buildCasinoTitle'),
          text: t('affiliate.buildCasinoText'),
        },
        {
          icon: PUBLIC_IMAGES.marketing.icons.pillar2,
          title: t('affiliate.ownDomainTitle'),
          text: t('affiliate.ownDomainText'),
        },
        {
          icon: PUBLIC_IMAGES.marketing.icons.pillar3,
          title: t('affiliate.rewardTitle'),
          text: t('affiliate.rewardText'),
        },
      ] as const,
    [t],
  )

  return (
    <PageLayout>
      <article
        className={cn(
          'w-full min-w-0 overflow-x-hidden',
          MARKETING_MAX_WIDTH_CLASS,
          MARKETING_PAGE_GUTTER_X_CLASS,
          MARKETING_PAGE_TAIL_CLASS,
        )}
        aria-labelledby={headingId}
      >
        <div className={cn(MARKETING_LP_SHELL_CLASS, MARKETING_SECTION_STACK_CLASS)}>
        <h1 id={headingId} className="sr-only">
          {t('affiliate.title', 'AFFILIATE')} {t('affiliate.highlight', 'PROGRAM')}
        </h1>

        <figure className="marketing-page-hero relative mb-2 w-full min-w-0 overflow-hidden rounded-2xl border border-fin-line/50 shadow-[var(--card-elev-shadow)]">
          <StableImg
            src={PUBLIC_IMAGES.marketing.affiliateHero}
            alt=""
            width={1200}
            height={360}
            className={MARKETING_HERO_PRIMARY_IMG_CLASS}
            sizes="(max-width: 768px) 100vw, min(96vw, 1200px)"
            loading="eager"
            fetchPriority="high"
          />
          <figcaption className="sr-only">{t('affiliate.heroCaption', 'Hình minh họa chương trình đối tác')}</figcaption>
        </figure>

        <figure className="mb-6 w-full min-w-0 overflow-hidden rounded-2xl border border-fin-line/50 shadow-[var(--card-elev-shadow)]">
          <StableImg
            src={PUBLIC_IMAGES.marketing.affiliateSecondary}
            alt=""
            width={1200}
            height={320}
            className={MARKETING_HERO_SECONDARY_IMG_CLASS}
            sizes="(max-width: 768px) 100vw, min(96vw, 1200px)"
            loading="lazy"
          />
          <figcaption className="sr-only">{t('affiliate.secondaryHeroCaption', 'Hình minh họa bổ sung đối tác')}</figcaption>
        </figure>

        <ContentSection title={t('affiliate.introTitle', 'Giới thiệu chương trình')} glow>
          <p className={PAGE_PROSE_BODY_CLASS}>
            {t(
              'affiliate.introP',
              'Chia sẻ link giới thiệu, theo dõi chuyển đổi và nhận hoa hồng theo mô hình đã công bố. Bảng điều khiển giúp bạn kiểm soát hiệu suất từng ngày.',
            )}
          </p>
          <ul className={cn(PAGE_PROSE_BODY_CLASS, 'mt-4 list-none space-y-2 border-t border-white/[0.06] pt-4 text-text-muted')}>
            <li className="flex gap-2 text-balance">
              <span className="text-primary" aria-hidden>
                •
              </span>
              {t('affiliate.introBullet1', 'Không thu phí tham gia; điều kiện hoa hồng và khuyến mãi áp dụng theo từng đợt công bố trên hệ thống.')}
            </li>
            <li className="flex gap-2 text-balance">
              <span className="text-primary" aria-hidden>
                •
              </span>
              {t('affiliate.introBullet2', 'Nghiêm cấm spam, lừa đảo hoặc quảng bá sai sự thật — vi phạm có thể bị khóa tài khoản đối tác.')}
            </li>
          </ul>
        </ContentSection>

        <ContentSection title={t('affiliate.showcaseTitle', 'Sản phẩm để chia sẻ')} glow>
          <p className={cn(PAGE_PROSE_BODY_CLASS, 'mb-6')}>
            {t(
              'affiliate.showcaseLead',
              'Đối tác có thể giới thiệu trực tiếp các sảnh chính — mỗi sảnh có banner và trải nghiệm riêng, dễ dùng trong landing page hoặc mạng xã hội.',
            )}
          </p>
          <div className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-4">
            {(
              [
                {
                  to: '/livecasino',
                  src: PUBLIC_IMAGES.banners.live,
                  label: t('affiliate.showcaseLive', 'Live casino'),
                  Icon: Tv,
                },
                {
                  to: '/slots',
                  src: PUBLIC_IMAGES.banners.slots,
                  label: t('affiliate.showcaseSlots', 'Slots'),
                  Icon: Dice5,
                },
                {
                  to: '/sports',
                  src: PUBLIC_IMAGES.banners.sports,
                  label: t('affiliate.showcaseSports', 'Thể thao'),
                  Icon: Trophy,
                },
                {
                  to: '/lottery',
                  src: PUBLIC_IMAGES.banners.lottery,
                  label: t('affiliate.showcaseLottery', 'Lô đề'),
                  Icon: Ticket,
                },
              ] as const satisfies ReadonlyArray<{
                to: string
                src: string
                label: string
                Icon: LucideIcon
              }>
            ).map(({ Icon, ...cell }) => (
              <Link
                key={cell.to}
                to={cell.to}
                className="group hover-glow relative block min-h-0 overflow-hidden rounded-[var(--radius-standard)] border border-fin-line/60 no-underline"
              >
                <StableImg
                  src={cell.src}
                  alt=""
                  width={400}
                  height={240}
                  className={cn(MARKETING_SHOWCASE_4UP_IMG_CLASS, 'transition-transform duration-500 group-hover:scale-[1.04]')}
                  sizes="(max-width: 1024px) 50vw, 25vw"
                />
                <span
                  className="pointer-events-none absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-[var(--radius-standard)] border border-primary/35 bg-secondary-darker/75 text-primary shadow-[0_4px_16px_rgba(0,0,0,0.35)] backdrop-blur-[6px]"
                  aria-hidden
                >
                  <Icon className="h-[1.125rem] w-[1.125rem] shrink-0" strokeWidth={2.25} />
                </span>
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-2 py-2.5 text-center text-[10px] font-black uppercase tracking-wide text-white sm:text-[11px]">
                  {cell.label}
                </span>
              </Link>
            ))}
          </div>
        </ContentSection>

        <ContentSection title={t('affiliate.pillarsTitle', 'Nền tảng cho đối tác')} accent>
          <div className="marketing-autofit-grid">
            {pillars.map(({ icon, title, text }) => (
              <div
                key={title}
                className="hover-glow flex flex-col gap-3 rounded-[var(--radius-standard)] border border-fin-line/60 bg-fin-inset/50 p-[clamp(1rem,2.5vw,1.35rem)] transition-shadow duration-300 ease-out will-change-transform hover:z-[1] hover:shadow-xl"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-standard)] border border-fin-line bg-page-surface overflow-hidden p-1.5">
                  <img src={icon} alt="" className="w-full h-full object-contain" />
                </div>
                <h3 className="font-black uppercase tracking-tight text-white text-[clamp(0.9375rem,1.8vw,1.0625rem)]">
                  {title}
                </h3>
                <p className="text-text-muted text-[clamp(0.8125rem,1.5vw,0.875rem)] font-medium leading-relaxed">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </ContentSection>

        <AffiliateCommission steps={steps} commissionTiers={commissionTiers} benefits={benefits} />

        <ContentSection title={t('affiliate.faqTitle', 'Câu hỏi thường gặp')}>
          <dl className="space-y-4 text-sm leading-relaxed text-text-muted">
            <div className="rounded-[var(--radius-standard)] border border-fin-line/50 bg-fin-inset/40 p-4">
              <dt className="font-black uppercase tracking-wide text-white">
                {t('affiliate.faq.q1', 'Khi nào được thanh toán hoa hồng?')}
              </dt>
              <dd className="mt-2 text-balance">
                {t(
                  'affiliate.faq.a1',
                  'Theo chu kỳ đối soát đã công bố (thường theo tuần/tháng). Chi tiết hiển thị trên trang đối tác sau khi tài khoản được duyệt.',
                )}
              </dd>
            </div>
            <div className="rounded-[var(--radius-standard)] border border-fin-line/50 bg-fin-inset/40 p-4">
              <dt className="font-black uppercase tracking-wide text-white">
                {t('affiliate.faq.q2', 'Cần giấy tờ gì để tham gia?')}
              </dt>
              <dd className="mt-2 text-balance">
                {t(
                  'affiliate.faq.a2',
                  'Thông tin liên hệ và kênh quảng bá (website / mạng xã hội) để đội ngũ xét duyệt. Yêu cầu có thể khác theo từng thị trường.',
                )}
              </dd>
            </div>
            <div className="rounded-[var(--radius-standard)] border border-fin-line/50 bg-fin-inset/40 p-4">
              <dt className="font-black uppercase tracking-wide text-white">
                {t('affiliate.faq.q3', 'Có giới hạn số người giới thiệu không?')}
              </dt>
              <dd className="mt-2 text-balance">
                {t(
                  'affiliate.faq.a3',
                  'Không giới hạn số lượng người chơi hợp lệ bạn giới thiệu; hoa hồng tính theo điều kiện từng chương trình và chu kỳ đối soát.',
                )}
              </dd>
            </div>
            <div className="rounded-[var(--radius-standard)] border border-fin-line/50 bg-fin-inset/40 p-4">
              <dt className="font-black uppercase tracking-wide text-white">
                {t('affiliate.faq.q4', 'Tôi có thể dùng banner / logo thương hiệu không?')}
              </dt>
              <dd className="mt-2 text-balance">
                {t(
                  'affiliate.faq.a4',
                  'Sau khi duyệt đối tác, bạn nhận bộ tài liệu và kích thước banner gợi ý — không chỉnh sửa logo sai quy chuẩn hoặc gây hiểu nhầm về thưởng.',
                )}
              </dd>
            </div>
            <div className="rounded-[var(--radius-standard)] border border-fin-line/50 bg-fin-inset/40 p-4">
              <dt className="font-black uppercase tracking-wide text-white">
                {t('affiliate.faq.q5', 'Theo dõi hiệu suất ở đâu?')}
              </dt>
              <dd className="mt-2 text-balance">
                {t(
                  'affiliate.faq.a5',
                  'Dashboard đối tác (sau đăng nhập và kích hoạt) hiển thị click, đăng ký và hoa hồng tích lũy — chi tiết theo từng giai đoạn cấu hình.',
                )}
              </dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/terms" className="text-center text-xs font-bold uppercase tracking-wide text-primary underline-offset-4 hover:underline">
              {t('affiliate.linkTerms', 'Điều khoản')}
            </Link>
            <span className="text-text-gray" aria-hidden>
              |
            </span>
            <Link to="/contact" className="text-center text-xs font-bold uppercase tracking-wide text-primary underline-offset-4 hover:underline">
              {t('affiliate.linkContact', 'Liên hệ')}
            </Link>
          </div>
        </ContentSection>

        <ContentSection title={t('affiliate.liveCommissions')}>
          <div className="overflow-x-auto rounded-[var(--radius-standard)] border border-fin-line fin-inset">
            <table className="w-full min-w-[320px] text-left text-sm">
              <thead>
                <tr className="border-b border-fin-line bg-white/[0.04] text-[10px] font-black uppercase tracking-widest text-text-gray">
                  <th className="px-4 py-3">{t('affiliate.tablePartner')}</th>
                  <th className="px-4 py-3">{t('affiliate.tableAmount')}</th>
                  <th className="px-4 py-3 text-right">{t('affiliate.tableTime')}</th>
                </tr>
              </thead>
              <tbody>
                {recentRows.map((row) => (
                  <tr
                    key={`${row.player}-${row.time}`}
                    className="border-b border-fin-line/60 last:border-0 hover:bg-white/[0.03]"
                  >
                    <td className="px-4 py-3 font-bold text-white">{row.player}</td>
                    <td className="px-4 py-3 font-black text-primary">{row.amount}</td>
                    <td className="px-4 py-3 text-right text-text-muted">{row.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="primary"
              onClick={() => window.location.href = '/contact'}
              className="inline-flex min-h-[44px] items-center justify-center px-6 py-2.5 text-center font-black uppercase tracking-wide no-underline"
            >
              {t('affiliate.ctaPartner', 'Đăng ký làm đối tác')}
            </Button>
          </div>
        </ContentSection>
        </div>
      </article>
    </PageLayout>
  )
}

export default Affiliate
