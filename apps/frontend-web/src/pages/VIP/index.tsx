import * as React from 'react'
import { useNavigate, Link } from 'react-router-dom'
import PageLayout from '../../components/ui/PageLayout'
import ContentSection from '../../components/ui/ContentSection'
import SurfaceCard from '../../components/ui/SurfaceCard'
import Loading from '../../components/ui/Loading'
import Button from '../../components/ui/Button'
import { StableImg } from '../../components/ui/StableImg'
import { useLanguage } from '../../i18n/LanguageContext'
import { cn } from '../../lib/cn'
import {
  MARKETING_HERO_VIP_IMG_CLASS,
  MARKETING_LP_SHELL_CLASS,
  MARKETING_MAX_WIDTH_CLASS,
  MARKETING_PAGE_GUTTER_X_CLASS,
  MARKETING_PAGE_TAIL_CLASS,
  MARKETING_SECTION_STACK_CLASS,
  MARKETING_SHOWCASE_TILE_ASPECT_CLASS,
  MARKETING_WIDE_CAPTION_IMG_CLASS,
  PAGE_PROSE_BODY_CLASS,
  PAGE_PROSE_BODY_SM_CLASS,
} from '../../constants/pageShell'
import { PUBLIC_IMAGES } from '../../constants/publicAssets'
import { useVipTiers, type VipTier } from '../../hooks/useVipTiers'

function fmtVnd(n: number): string {
  try {
    return `${new Intl.NumberFormat('vi-VN').format(n)} đ`
  } catch {
    return `${n} đ`
  }
}

/** Khi API `/vip-tiers-config` trống — vẫn hiển thị bậc tham chiếu, không để trang trống. */
const VIP_FALLBACK: VipTier[] = [
  {
    level: 1,
    name: 'Đồng',
    minValidBet: 0,
    upReward: 0,
    cashbackRate: 0.3,
    lossReturnRate: 0,
    lossReturnMax: 0,
    fridayBonusRate: 0,
    fridayBonusMax: 0,
    badgeImage: '',
    cardImage: '',
    colorCode: '#b45309',
  },
  {
    level: 2,
    name: 'Bạc',
    minValidBet: 50_000_000,
    upReward: 188_000,
    cashbackRate: 0.45,
    lossReturnRate: 0.05,
    lossReturnMax: 5_000_000,
    fridayBonusRate: 0.1,
    fridayBonusMax: 2_000_000,
    badgeImage: '',
    cardImage: '',
    colorCode: '#94a3b8',
  },
  {
    level: 3,
    name: 'Vàng',
    minValidBet: 200_000_000,
    upReward: 588_000,
    cashbackRate: 0.65,
    lossReturnRate: 0.08,
    lossReturnMax: 12_000_000,
    fridayBonusRate: 0.15,
    fridayBonusMax: 5_000_000,
    badgeImage: '',
    cardImage: '',
    colorCode: '#eab308',
  },
  {
    level: 4,
    name: 'Kim cương',
    minValidBet: 800_000_000,
    upReward: 2_000_000,
    cashbackRate: 0.9,
    lossReturnRate: 0.12,
    lossReturnMax: 30_000_000,
    fridayBonusRate: 0.22,
    fridayBonusMax: 12_000_000,
    badgeImage: '',
    cardImage: '',
    colorCode: '#38bdf8',
  },
]

const VIP: React.FC = () => {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const headingId = React.useId()
  const { tiers, loading } = useVipTiers()
  const displayTiers = tiers.length > 0 ? tiers : VIP_FALLBACK

  const pillars = React.useMemo(
    () =>
      [
        {
          icon: PUBLIC_IMAGES.marketing.icons.pillar1,
          title: t('vip.pillar1.title', 'Đặc quyền theo cấp'),
          text: t(
            'vip.pillar1.text',
            'Mỗi bậc mở thêm tỷ lệ hoàn trả, thưởng thăng cấp và ưu tiên xử lý giao dịch.',
          ),
        },
        {
          icon: PUBLIC_IMAGES.marketing.icons.pillar2,
          title: t('vip.pillar2.title', 'Minh bạch số liệu'),
          text: t(
            'vip.pillar2.text',
            'Ngưỡng cược và phần trăm hiển thị rõ trên bảng — cập nhật theo chính sách đang áp dụng.',
          ),
        },
        {
          icon: PUBLIC_IMAGES.marketing.icons.pillar3,
          title: t('vip.pillar3.title', 'Hỗ trợ ưu tiên'),
          text: t(
            'vip.pillar3.text',
            'Kênh hỗ trợ VIP và account manager cho thành viên đạt bậc cao theo quy định nội bộ.',
          ),
        },
      ] as const,
    [t],
  )

  const faqItems = React.useMemo(
    () =>
      [
        {
          q: t('vip.faq.q1', 'Làm sao biết cấp VIP hiện tại của tôi?'),
          a: t(
            'vip.faq.a1',
            'Cấp được xác định theo tổng cược hợp lệ trong chu kỳ. Bạn có thể xem chi tiết trong tài khoản hoặc hỏi hỗ trợ kèm ID.',
          ),
        },
        {
          q: t('vip.faq.q2', 'Hoàn trả được cộng khi nào?'),
          a: t(
            'vip.faq.a2',
            'Theo lịch và điều kiện từng chương trình — thường tự động vào ví sau khi hệ thống đối soát xong.',
          ),
        },
        {
          q: t('vip.faq.q3', 'Số liệu trên trang có phải cam kết cố định?'),
          a: t(
            'vip.faq.a3',
            'Bảng tham chiếu có thể thay đổi theo khuyến mãi. Luôn ưu tiên nội dung công bố tại mục Khuyến mãi và điều khoản.',
          ),
        },
      ] as const,
    [t],
  )

  return (
    <PageLayout>
      <article
        className={cn(
          'vip-page-wrap w-full min-w-0',
          MARKETING_MAX_WIDTH_CLASS,
          MARKETING_PAGE_GUTTER_X_CLASS,
          MARKETING_PAGE_TAIL_CLASS,
        )}
        aria-labelledby={headingId}
      >
        <div className={cn(MARKETING_LP_SHELL_CLASS, MARKETING_SECTION_STACK_CLASS)}>
        <figure className="marketing-page-hero relative mb-2 w-full min-w-0 overflow-hidden rounded-2xl border border-fin-line/50 shadow-[var(--card-elev-shadow)]">
          <StableImg
            src={PUBLIC_IMAGES.marketing.vipHero}
            alt=""
            width={1200}
            height={400}
            className={MARKETING_HERO_VIP_IMG_CLASS}
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
              className="text-balance font-black uppercase tracking-tight text-white text-[clamp(1.5rem,4.5vw,2.75rem)] leading-tight"
            >
              {t('vip.title', 'VIP')}{' '}
              <span className="text-primary">{t('vip.highlight', 'CLUB')}</span>
            </h1>
            <p className={cn(PAGE_PROSE_BODY_CLASS, 'mt-2 max-w-xl text-white/85')}>
              {t(
                'vip.heroSubtitle',
                'Tích lũy cược hợp lệ, mở khóa hoàn trả và quyền lợi dành cho thành viên trung thành.',
              )}
            </p>
          </div>
          <figcaption className="sr-only">{t('vip.heroCaption', 'Không gian VIP — hình minh họa')}</figcaption>
        </figure>

        <ContentSection title={t('vip.introTitle', 'Giới thiệu chương trình')} glow>
          <p className={PAGE_PROSE_BODY_CLASS}>
            {t(
              'vip.introP1',
              'VIP Club ghi nhận hoạt động cược hợp lệ của bạn theo chu kỳ và phân bậc rõ ràng. Càng lên cao, bạn càng tiếp cận thêm quyền lợi tài chính và dịch vụ.',
            )}
          </p>
          <p className={cn(PAGE_PROSE_BODY_CLASS, 'mt-4')}>
            {t(
              'vip.introP2',
              'Dưới đây là bảng tham chiếu các cấp; nếu hệ thống đang đồng bộ từ máy chủ, số liệu có thể khớp 1:1 với tài khoản của bạn.',
            )}
          </p>
          <ul className={cn(PAGE_PROSE_BODY_CLASS, 'mt-4 list-none space-y-2 border-t border-white/[0.06] pt-4 text-text-muted')}>
            <li className="flex gap-2 text-balance">
              <span className="text-primary" aria-hidden>
                •
              </span>
              {t(
                'vip.introBullet1',
                'Tham gia tự động theo điều kiện tài khoản; không cần đăng ký riêng nếu đã đủ điều kiện nội bộ.',
              )}
            </li>
            <li className="flex gap-2 text-balance">
              <span className="text-primary" aria-hidden>
                •
              </span>
              {t(
                'vip.introBullet2',
                'Mọi tranh chấp hoặc chậm cập nhật cấp — liên hệ hỗ trợ 24/7 kèm mã giao dịch / ID.',
              )}
            </li>
          </ul>
        </ContentSection>

        <ContentSection title={t('vip.pillarsTitle', 'Vì sao tham gia')} accent>
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

        <ContentSection title={t('vip.experience.title', 'Sảnh game & đặc quyền')} accent>
          <p className={cn(PAGE_PROSE_BODY_CLASS, 'mb-6')}>
            {t(
              'vip.experience.lead',
              'VIP được ưu tiên trải nghiệm các sản phẩm chủ lực — live casino, slots, thể thao — với hỗ trợ nhanh và ưu đãi theo bậc.',
            )}
          </p>
          <div className="mb-6 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
            {(
              [
                {
                  to: '/livecasino',
                  src: PUBLIC_IMAGES.marketing.vipShowcaseLive,
                  title: t('vip.experience.live', 'Live casino'),
                  desc: t('vip.experience.liveDesc', 'Bàn chơi HD, dealer chuyên nghiệp.'),
                },
                {
                  to: '/slots',
                  src: PUBLIC_IMAGES.banners.slots,
                  title: t('vip.experience.slots', 'Slots'),
                  desc: t('vip.experience.slotsDesc', 'Jackpot & nhà cung cấp hot.'),
                },
                {
                  to: '/sports',
                  src: PUBLIC_IMAGES.marketing.vipShowcaseSports,
                  title: t('vip.experience.sports', 'Thể thao'),
                  desc: t('vip.experience.sportsDesc', 'Kèo đa dạng, cập nhật realtime.'),
                },
              ] as const
            ).map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="group hover-glow flex min-h-0 flex-col overflow-hidden rounded-[var(--radius-standard)] border border-fin-line/60 bg-fin-inset/45 no-underline transition-shadow duration-300 hover:border-primary/35 hover:shadow-lg"
              >
                <div className={cn(MARKETING_SHOWCASE_TILE_ASPECT_CLASS, 'min-h-0')}>
                  <StableImg
                    src={item.src}
                    alt=""
                    width={640}
                    height={360}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                </div>
                <div className="flex flex-col gap-1 p-3 sm:p-4">
                  <span className="font-black uppercase tracking-tight text-white text-[clamp(0.8125rem,1.6vw,0.9375rem)] group-hover:text-primary">
                    {item.title}
                  </span>
                  <span className="text-[clamp(0.6875rem,1.4vw,0.75rem)] font-medium leading-snug text-text-muted">{item.desc}</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
            <figure className="overflow-hidden rounded-[var(--radius-standard)] border border-fin-line/50">
              <StableImg
                src={PUBLIC_IMAGES.banners.fishing}
                alt=""
                width={800}
                height={420}
                className={MARKETING_WIDE_CAPTION_IMG_CLASS}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <figcaption className="border-t border-fin-line/40 bg-fin-inset/50 px-3 py-2 text-center text-[11px] font-bold uppercase tracking-wide text-text-muted">
                {t('vip.experience.fishingCaption', 'Bắn cá — giải trí tốc độ cao')}
              </figcaption>
            </figure>
            <figure className="overflow-hidden rounded-[var(--radius-standard)] border border-fin-line/50">
              <StableImg
                src={PUBLIC_IMAGES.banners.lottery}
                alt=""
                width={800}
                height={420}
                className={MARKETING_WIDE_CAPTION_IMG_CLASS}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <figcaption className="border-t border-fin-line/40 bg-fin-inset/50 px-3 py-2 text-center text-[11px] font-bold uppercase tracking-wide text-text-muted">
                {t('vip.experience.lotteryCaption', 'Lô đề — kết quả minh bạch')}
              </figcaption>
            </figure>
          </div>
        </ContentSection>

        <ContentSection title={t('vip.tiers.title', 'Cấp bậc')}>
          <p className={cn(PAGE_PROSE_BODY_CLASS, 'mb-4')}>
            {t(
              'vip.tiers.p',
              'Tham gia chương trình VIP để nhận hoàn trả cao hơn, quà tặng sinh nhật và quản lý tài khoản riêng.',
            )}
          </p>
          <p className={cn(PAGE_PROSE_BODY_CLASS, 'mb-6')}>
            {t(
              'vip.tiers.p2',
              'So sánh nhanh các ngưỡng dưới đây; một số cột chỉ hiện từ bậc Bạc trở lên khi có dữ liệu từ hệ thống.',
            )}
          </p>
          {loading ? (
            <Loading variant="section" text={t('common.loading', 'Đang tải…')} />
          ) : (
            <div className="marketing-autofit-grid">
              {displayTiers.map((tier) => (
                <SurfaceCard
                  key={`${tier.level}-${tier.name}`}
                  as="section"
                  variant="inset"
                  className="hover-glow flex min-w-0 flex-col gap-0 overflow-hidden rounded-[var(--radius-standard)] border border-fin-line/60 p-0 transition-shadow duration-300 ease-out will-change-transform hover:z-[1] hover:shadow-xl"
                >
                  <div
                    className="h-1.5 w-full shrink-0"
                    style={{ background: `linear-gradient(90deg, ${tier.colorCode}, transparent)` }}
                    aria-hidden
                  />
                  <div className="flex flex-col gap-[clamp(0.5rem,1.5vw,0.875rem)] p-[clamp(1rem,2.5vw,1.35rem)]">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <span
                        className="inline-flex items-center rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-widest text-white"
                        style={{ backgroundColor: `${tier.colorCode}99` }}
                      >
                        LV.{tier.level}
                      </span>
                      {tier.badgeImage ? (
                        <img
                          src={tier.badgeImage}
                          alt=""
                          width={40}
                          height={40}
                          className="h-10 w-10 shrink-0 object-contain"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <span
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 text-lg"
                          style={{ color: tier.colorCode }}
                          aria-hidden
                        >
                          ★
                        </span>
                      )}
                    </div>
                    <h3 className="break-words font-black uppercase tracking-tight text-white text-[clamp(1rem,2vw,1.125rem)]">
                      {tier.name}
                    </h3>
                    <dl className="min-w-0 space-y-2 text-[clamp(0.6875rem,1.5vw,0.8125rem)] text-text-muted">
                      <div className="flex flex-col gap-1 border-b border-white/[0.06] pb-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                        <dt className="max-w-[min(100%,14rem)] shrink-0 font-medium text-text-muted">
                          {t('vip.field.minBet', 'Cược hợp lệ tối thiểu')}
                        </dt>
                        <dd className="min-w-0 break-words text-left font-bold text-white sm:text-right">
                          {fmtVnd(tier.minValidBet)}
                        </dd>
                      </div>
                      {tier.upReward > 0 ? (
                        <div className="flex flex-col gap-1 border-b border-white/[0.06] pb-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                          <dt className="max-w-[min(100%,14rem)] shrink-0 font-medium">
                            {t('vip.field.upReward', 'Thưởng thăng cấp')}
                          </dt>
                          <dd className="min-w-0 break-words text-left font-bold text-primary sm:text-right">{fmtVnd(tier.upReward)}</dd>
                        </div>
                      ) : null}
                      <div className="flex flex-col gap-1 border-b border-white/[0.06] pb-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                        <dt className="max-w-[min(100%,14rem)] shrink-0 font-medium">{t('vip.field.cashback', 'Hoàn trả')}</dt>
                        <dd className="min-w-0 text-left font-bold text-white sm:text-right">{tier.cashbackRate}%</dd>
                      </div>
                      {tier.lossReturnRate > 0 ? (
                        <div className="flex flex-col gap-1 border-b border-white/[0.06] pb-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                          <dt className="max-w-[min(100%,14rem)] shrink-0 font-medium">
                            {t('vip.field.lossReturn', 'Hoàn thua tối đa')}
                          </dt>
                          <dd className="min-w-0 break-words text-left font-bold text-white sm:text-right">
                            {tier.lossReturnRate}% / {fmtVnd(tier.lossReturnMax)}
                          </dd>
                        </div>
                      ) : null}
                      {tier.fridayBonusRate > 0 ? (
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                          <dt className="max-w-[min(100%,14rem)] shrink-0 font-medium">
                            {t('vip.field.fridayBonus', 'Thưởng thứ Sáu')}
                          </dt>
                          <dd className="min-w-0 break-words text-left font-bold text-primary sm:text-right">
                            {tier.fridayBonusRate}% / {fmtVnd(tier.fridayBonusMax)}
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                    {tier.cardImage ? (
                      <img
                        src={tier.cardImage}
                        alt=""
                        width={360}
                        height={112}
                        className="mt-2 max-h-40 w-full rounded-lg object-contain object-center bg-fin-inset/25"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : null}
                  </div>
                </SurfaceCard>
              ))}
            </div>
          )}
        </ContentSection>

        <ContentSection title={t('vip.how.title', 'Cách thăng hạng')} glow>
          <p className={PAGE_PROSE_BODY_CLASS}>
            {t(
              'vip.how.p',
              'Cấp VIP xác định theo tổng cược hợp lệ trong chu kỳ (thường theo tháng). Khi đạt ngưỡng, hệ thống tự ghi nhận — nếu chưa thấy cập nhật, liên hệ hỗ trợ kèm ID tài khoản.',
            )}
          </p>
        </ContentSection>

        <ContentSection title={t('vip.perks.title', 'Quyền lợi nổi bật')} accent>
          <ul className={cn(PAGE_PROSE_BODY_CLASS, 'list-none space-y-3')}>
            <li className="flex gap-3 rounded-[var(--radius-standard)] border border-fin-line/50 bg-fin-inset/40 px-4 py-3">
              <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
              <span>
                {t('vip.perks.1', 'Hoàn trả cược và hoàn thua theo cấp — tự động cộng vào ví chính.')}
              </span>
            </li>
            <li className="flex gap-3 rounded-[var(--radius-standard)] border border-fin-line/50 bg-fin-inset/40 px-4 py-3">
              <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
              <span>{t('vip.perks.2', 'Ưu tiên rút tiền và hỗ trợ VIP kênh riêng (account manager).')}</span>
            </li>
            <li className="flex gap-3 rounded-[var(--radius-standard)] border border-fin-line/50 bg-fin-inset/40 px-4 py-3">
              <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
              <span>{t('vip.perks.3', 'Quà sinh nhật / sự kiện theo chính sách khuyến mãi đang áp dụng.')}</span>
            </li>
          </ul>
        </ContentSection>

        <ContentSection title={t('vip.faq.title', 'Câu hỏi thường gặp')} glow>
          <dl className="min-w-0 space-y-5">
            {faqItems.map(({ q, a }) => (
              <div key={q} className="border-b border-white/[0.06] pb-5 last:border-0 last:pb-0">
                <dt className="font-bold text-white text-token-base">{q}</dt>
                <dd className={cn(PAGE_PROSE_BODY_CLASS, 'mt-2')}>{a}</dd>
              </div>
            ))}
          </dl>
        </ContentSection>

        <ContentSection title={t('vip.contact.title', 'Liên hệ & tiếp theo')} glow>
          <p className={PAGE_PROSE_BODY_CLASS}>
            {t('vip.contact.p', 'Chi tiết điều kiện và nâng hạng — xem mục Khuyến mãi hoặc liên hệ hỗ trợ 24/7.')}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
              <Button
                variant="primary"
                onClick={() => navigate('/promotions')}
                className="inline-flex min-h-[44px] items-center justify-center px-5 text-sm font-black uppercase tracking-wide"
              >
                {t('vip.ctaPromotions', 'Xem khuyến mãi')}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/help-center')}
                className="inline-flex min-h-[44px] items-center justify-center px-5 text-sm font-black uppercase tracking-wide hover:border-primary/40 hover:bg-fin-inset"
              >
                {t('vip.ctaHelp', 'Trung tâm trợ giúp')}
              </Button>
          </div>
          <p className={cn(PAGE_PROSE_BODY_SM_CLASS, 'mt-6 border-t border-white/[0.06] pt-4')}>
            {t(
              'vip.disclaimer',
              'Nội dung trang mang tính giới thiệu. Điều khoản áp dụng theo thông báo chính thức tại thời điểm giao dịch.',
            )}
          </p>
        </ContentSection>
        </div>
      </article>
    </PageLayout>
  )
}

export default VIP
