import * as React from 'react'
import PageLayout from '../../components/ui/PageLayout'
import PolicyDocumentLayout from '../../components/layout/PolicyDocumentLayout'
import ContentSection from '../../components/ui/ContentSection'
import SupportContactsMobile from '../../components/contact/SupportContactsMobile'
import { useLanguage } from '../../i18n/LanguageContext'
import { cn } from '../../lib/cn'
import { PAGE_PROSE_BODY_CLASS } from '../../constants/pageShell'
import { PUBLIC_IMAGES } from '../../constants/publicAssets'

const ContactUs: React.FC = () => {
  const { t } = useLanguage()

  return (
    <PageLayout>
      <PolicyDocumentLayout
        title={t('contact.title', 'LIÊN HỆ')}
        highlight={t('contact.highlight', 'CHÚNG TÔI')}
        subtitle={t('contact.subtitle', 'Hỗ trợ 24/7 qua live chat trên trang chủ.')}
        icon={PUBLIC_IMAGES.policy.document}
      >
        <ContentSection
          title={t('contact.channels.title', 'Kênh hỗ trợ')}
          headingClassName={cn(
            'max-lg:!normal-case max-lg:text-center max-lg:text-[15px] max-lg:font-extrabold max-lg:tracking-[0.06em]',
          )}
          className="contact-channels-section"
        >
          <SupportContactsMobile />
          <p className={cn(PAGE_PROSE_BODY_CLASS, 'hidden lg:block')}>
            {t(
              'contact.channels.p',
              'Ưu tiên live chat để xử lý nhanh giao dịch và tài khoản. Email và mạng xã hội (nếu có) được công bố trên banner chính thức — tránh kênh giả mạo.',
            )}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-text-muted lg:hidden">
            {t(
              'contact.channels.pShort',
              'Ưu tiên live chat để xử lý nhanh. Tránh kênh giả mạo — chỉ dùng link chính thức bên dưới.',
            )}
          </p>
        </ContentSection>
        <ContentSection title={t('contact.response.title', 'Thời gian phản hồi')} glow>
          <p className={PAGE_PROSE_BODY_CLASS}>{t('contact.response.p', 'Chat: vài phút. Email: trong 24–48 giờ làm việc tùy độ phức tạp.')}</p>
        </ContentSection>
      </PolicyDocumentLayout>
    </PageLayout>
  )
}

export default ContactUs
