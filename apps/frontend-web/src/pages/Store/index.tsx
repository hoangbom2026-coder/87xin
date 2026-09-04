import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import PageLayout from '../../components/ui/PageLayout'
import BannerHeader from '../../components/ui/BannerHeader'
import Button from '../../components/ui/Button'
import PromoTemplatePage, { PromoCardItem, PromoFilter } from '../Promotions/PromoTemplatePage'
import { PromoDetailModal } from '../../components/promo'
import { getStorePackages, purchaseStorePackage, StorePackage } from '../../services/siteService'
import { getProfile } from '../../services/authService'
import { setUser } from '../../features/auth/authSlice'
import type { RootState, AppDispatch } from '../../store'
import { resolveAssetUrl } from '../../utils/assets'
import { useLanguage } from '../../i18n/LanguageContext'
import { useLocale } from '../../hooks/useLocale'
import { toast } from '../../utils/toast'

const filters = (t: (key: string, fallback?: string) => string): PromoFilter[] => [
  { value: 'all', label: t('common.all') },
  { value: 'coins', label: t('common.coins') },
  { value: 'vip', label: 'VIP' },
  { value: 'bonus', label: t('common.bonus') },
]

const fallbackCards = (): PromoCardItem[] => [
  {
    id: 'avatar-frame',
    title: <>EXCLUSIVE <br />FRAME</>,
    searchTitle: 'Exclusive Avatar Frame',
    description: '5,000 PTS',
    image: '/images/icons/ui/vipbadge_big.png',
    imageMode: 'icon',
    category: 'bonus',
    modalTitle: 'Exclusive Avatar Frame',
  },
  {
    id: 'chat-color',
    title: <>CHAT COLOR <br />PACK</>,
    searchTitle: 'Chat Color Pack',
    description: '2,500 PTS',
    image: '/images/icons/icon-nav/da-ga.webp',
    imageMode: 'icon',
    category: 'bonus',
    modalTitle: 'Chat Color Pack',
  },
  {
    id: 'vip-badge',
    title: <>VIP BADGE <br />30 DAYS</>,
    searchTitle: 'VIP Badge 30 Days',
    description: '10,000 PTS',
    image: '/images/icons/badge-31.png',
    imageMode: 'icon',
    category: 'vip',
    modalTitle: 'VIP Badge',
  },
  {
    id: 'spin-ticket',
    title: <>LUCKY SPIN <br />TICKET</>,
    searchTitle: 'Lucky Spin Ticket',
    description: '1,000 PTS',
    image: '/images/icons/icon-nav/no-hu.webp',
    imageMode: 'icon',
    category: 'bonus',
    modalTitle: 'Lucky Spin Ticket',
  },
]

const packageCategory = (pkg: StorePackage) => {
  const text = `${pkg.primaryCategoryId || ''} ${(pkg.categoryIds || []).join(' ')} ${pkg.title} ${JSON.stringify(pkg.benefits || {})}`.toLowerCase()
  if (text.includes('vip') || text.includes('xp')) return 'vip'
  if (text.includes('bonus') || pkg.freeCoins > 0) return 'bonus'
  return 'coins'
}

const toCard = (
  pkg: StorePackage,
  t: (key: string, fallback?: string) => string,
  formatBalance: (amt: number | string) => string,
  formatAmount: (amt: number | string) => string,
): PromoCardItem => ({
  id: pkg._id,
  title: <>{pkg.title}</>,
  searchTitle: pkg.title,
  description: pkg.description || `${formatBalance(pkg.price)} / ${formatAmount(pkg.goldCoins)} xu`,
  image: resolveAssetUrl(pkg.image, '/images/icons/icon-nav/no-hu.webp'),
  imageMode: pkg.image ? 'banner' : 'icon',
  category: packageCategory(pkg),
  actionLabel: t('store.buyNow', 'Mua ngay'),
  modalTitle: pkg.title,
  storePurchase: { packageId: pkg._id, price: pkg.price },
  modalBody: (
    <>
      <p className="red-underline">{t('store.packageDetails')}</p>
      <table className="promo_table table-responsive">
        <tbody>
          <tr>
            <th>{t('store.item')}</th>
            <th>{t('store.value')}</th>
          </tr>
          <tr>
            <td>{t('store.goldCoins')}</td>
            <td>{formatAmount(pkg.goldCoins)}</td>
          </tr>
          <tr>
            <td>{t('store.freeCoins')}</td>
            <td>{formatAmount(pkg.freeCoins)}</td>
          </tr>
          <tr>
            <td>{t('store.price')}</td>
            <td>{formatBalance(pkg.price)}</td>
          </tr>
          <tr>
            <td>{t('store.sold')}</td>
            <td>{formatAmount(pkg.soldCount || 0)}</td>
          </tr>
        </tbody>
      </table>
      <p className="basic-text">{t('store.adminControlled')}</p>
    </>
  ),
})

const Store: React.FC = () => {
  const { t } = useLanguage()
  const { formatBalance, formatAmount } = useLocale()
  const dispatch = useDispatch<AppDispatch>()
  const user = useSelector((s: RootState) => s.auth.user)
  const pageFilters = React.useMemo(() => filters(t), [t])
  const fallbackStoreCards = React.useMemo(() => fallbackCards(), [])
  const [cards, setCards] = React.useState<PromoCardItem[]>(fallbackStoreCards)
  const [selected, setSelected] = React.useState<PromoCardItem | null>(null)
  const [purchasing, setPurchasing] = React.useState(false)

  const applyPackages = React.useCallback(
    (packages: StorePackage[]) => {
      const active = packages.filter((pkg) => pkg.status !== 'inactive').sort((a, b) => (a.order || 0) - (b.order || 0))
      setCards(
        active.length ? active.map((pkg) => toCard(pkg, t, formatBalance, formatAmount)) : fallbackStoreCards,
      )
    },
    [fallbackStoreCards, t, formatBalance, formatAmount],
  )

  React.useEffect(() => {
    let alive = true

    getStorePackages()
      .then((packages) => {
        if (!alive) return
        applyPackages(packages)
      })
      .catch((error) => console.error('Failed to load store packages', error))

    return () => {
      alive = false
    }
  }, [applyPackages])

  const handleStorePurchase = React.useCallback(async () => {
    const meta = selected?.storePurchase
    if (!meta) return
    if (!user) {
      toast.info(t('store.loginToBuy', 'Đăng nhập để mua — dùng nút Đăng nhập trên menu.'))
      return
    }
    setPurchasing(true)
    const res = await purchaseStorePackage(meta.packageId)
    setPurchasing(false)
    if (res.success && res.data && res.data.success !== false) {
      toast.success(t('store.purchaseSuccess', 'Mua thành công. Số dư đã được cập nhật.'))
      const prof = await getProfile()
      if (prof.success && prof.data) dispatch(setUser(prof.data))
      setSelected(null)
      try {
        const packages = await getStorePackages()
        applyPackages(packages)
      } catch (e) {
        console.error(e)
      }
    } else {
      toast.error(res.message || t('store.purchaseFailed', 'Không thể hoàn tất mua hàng.'))
    }
  }, [selected, user, t, dispatch, applyPackages])

  const storeModalFooter = (() => {
    const sp = selected?.storePurchase
    if (!sp) return null
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <p className="m-0 text-[11px] leading-snug text-text-muted sm:max-w-[58%]">
          {t('store.debitNote', 'Số tiền sẽ trừ trực tiếp từ số dư theo giá gói.')}
        </p>
        <Button
          type="button"
          variant="primary"
          size="md"
          className="w-full shrink-0 uppercase sm:w-auto sm:min-w-[220px]"
          isLoading={purchasing}
          onClick={() => void handleStorePurchase()}
        >
          {user
            ? `${t('store.buyNow', 'Mua ngay')} — ${formatBalance(sp.price)}`
            : t('store.loginToBuy', 'Đăng nhập để mua')}
        </Button>
      </div>
    )
  })()

  return (
    <PageLayout variant="banner">
      <BannerHeader src="/images/banners/slots/slots.webp" alt={t('store.title')} eager />
      <PromoTemplatePage
        hideIntro
        title={t('store.title')}
        subtitle={t('store.subtitle')}
        filters={pageFilters}
        cards={cards}
        onCardClick={setSelected}
      />
      <PromoDetailModal card={selected} onClose={() => setSelected(null)} footer={storeModalFooter} />
    </PageLayout>
  )
}

export default Store
