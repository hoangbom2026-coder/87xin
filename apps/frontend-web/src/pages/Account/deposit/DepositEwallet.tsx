import * as React from 'react'
import { useEffect, useState } from 'react'
import { useLanguage } from '../../../i18n/LanguageContext'
import FinancialNotice from '../../../components/financial/FinancialNotice'
import { EWALLETS } from '../../../constants/financial'
import { getSiteSettings } from '../../../services/siteService'
import { resolveAssetUrl } from '../../../utils/assets'
import { DEPOSIT_EWALLET_GRID_CLASS } from '../../../constants/layoutGrids'
import { cn } from '../../../lib/cn'
import { ACCOUNT_VIEW_FADE_CLASS } from '../../../constants/pageShell'

interface EwalletItem {
  id?: string
  name: string
  img?: string
  icon?: string
}

/**
 * DepositEwallet — panel nạp ví điện tử (Momo, ZaloPay, ShopeePay…). Hiện tại trạng thái
 * bảo trì: chỉ hiển thị danh sách ví, không cho submit.
 */
const DepositEwallet: React.FC = () => {
  const { t } = useLanguage()
  const [list, setList] = useState<EwalletItem[]>(EWALLETS as EwalletItem[])

  useEffect(() => {
    getSiteSettings().then((res: any) => {
      const site = res?.data?.site || res?.site
      const arr = site?.vietnamDeposit?.methods?.ewallets
      if (Array.isArray(arr) && arr.length) setList(arr)
    })
  }, [])

  return (
    <div className={cn('space-y-8', ACCOUNT_VIEW_FADE_CLASS)}>
      <FinancialNotice as="p">
        {t(
          'deposit.ewalletNotice',
          'Ví điện tử đang bảo trì / chờ cấu hình cổng thanh toán. Danh sách hiển thị theo cài đặt site (nếu có).',
        )}
      </FinancialNotice>
      <div className={DEPOSIT_EWALLET_GRID_CLASS}>
        {list.map((w, i) => (
          <div
            key={String(w.id ?? w.name ?? i)}
            className="flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-2xl border border-fin-line bg-fin-deep p-4 opacity-85"
          >
            {(w.img || w.icon) && (
              <img
                src={resolveAssetUrl(w.img || w.icon || '')}
                alt={String(w.name)}
                width={32}
                height={32}
                loading="lazy"
                className="h-8 max-w-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.opacity = '0.3'
                }}
              />
            )}
            <span className="line-clamp-2 text-center text-[9px] font-black uppercase text-text-gray">
              {w.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DepositEwallet
