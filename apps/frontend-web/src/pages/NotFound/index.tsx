import * as React from 'react'
import { Link } from 'react-router-dom'
import PageLayout from '../../components/ui/PageLayout'
import { useLanguage } from '../../i18n/LanguageContext'

const NotFound: React.FC = () => {
  const { t } = useLanguage()
  return (
    <PageLayout title={t('errors.notFound', '404')}>
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-6xl font-black text-white/20">404</p>
        <p className="text-white/70">{t('errors.pageNotFound', 'Trang không tồn tại')}</p>
        <Link to="/" className="rounded-lg bg-primary px-6 py-2 text-sm font-bold text-white">
          {t('nav.home', 'Về trang chủ')}
        </Link>
      </div>
    </PageLayout>
  )
}

export default NotFound
