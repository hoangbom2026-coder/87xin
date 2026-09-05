import * as React from 'react';
import PageLayout from '../../components/ui/PageLayout';
import PolicyDocumentLayout from '../../components/layout/PolicyDocumentLayout';
import ContentSection from '../../components/ui/ContentSection';
import PolicyList from '../../components/ui/PolicyList';
import { useLanguage } from '../../i18n/LanguageContext';
import { PRIVACY_EMAIL } from '../../constants/siteUrls';
import { cn } from '../../lib/cn';
import { PAGE_PROSE_BODY_CLASS, MARKETING_LP_SHELL_CLASS, MARKETING_SECTION_STACK_CLASS } from '../../constants/pageShell';
import { PUBLIC_IMAGES } from '../../constants/publicAssets';
import { useSite } from '../../hooks/useSite';
import { applyBrand, getBrandName } from '../../lib/brand';

const Privacy: React.FC = () => {
  const { t } = useLanguage();
  const { siteData } = useSite();
  const brand = getBrandName(siteData);

  const privacyItems = [
    {
      title: t('privacy.item1.title', '1. Information We Collect'),
      content: t('privacy.item1.p', 'We collect information you provide directly to us, such as when you create an account, make a deposit, or communicate with our support team. This may include your name, email address, phone number, and payment details.')
    },
    {
      title: t('privacy.item2.title', '2. How We Use Your Information'),
      content: t('privacy.item2.p', 'We use your information to provide and improve our services, process transactions, verify your identity, and communicate with you about updates, promotions, and support.')
    },
    {
      title: t('privacy.item3.title', '3. Data Security'),
      content: t('privacy.item3.p', 'We implement industry-standard security measures to protect your information from unauthorized access, disclosure, or alteration. All financial transactions are encrypted using secure technologies.')
    },
    {
      title: t('privacy.item4.title', '4. Sharing of Information'),
      content: t('privacy.item4.p', 'We do not sell or rent your personal information to third parties. We may share information with trusted partners who assist us in operating our platform, provided they agree to keep this information confidential.')
    },
    {
      title: t('privacy.item5.title', '5. Cookies'),
      content: t('privacy.item5.p', 'Our website uses cookies to enhance your user experience, analyze site traffic, and personalize content. You can manage your cookie preferences through your browser settings.')
    }
  ];

  return (
    <PageLayout>
      <PolicyDocumentLayout
        title={t('privacy.title', 'PRIVACY')}
        highlight={t('privacy.highlight', 'POLICY')}
        subtitle={t('privacy.subtitle', 'How we protect and manage your personal information')}
        icon={PUBLIC_IMAGES.policy.privacyTerms}
      >
        <div className={cn(MARKETING_LP_SHELL_CLASS, MARKETING_SECTION_STACK_CLASS)}>
          <ContentSection title={t('privacy.intro.title', 'Introduction')}>
            <p className={PAGE_PROSE_BODY_CLASS}>
              {applyBrand(t('privacy.intro.p', 'At {{brand}}, we value your privacy and are committed to protecting your personal data. This Privacy Policy outlines how we collect, use, and safeguard your information when you use our website and services.'), brand)}
            </p>
          </ContentSection>

          <PolicyList items={privacyItems} />

          <ContentSection title={t('contact.title', 'Contact Us')} className="border-primary/20 bg-primary/5">
            <p className={PAGE_PROSE_BODY_CLASS}>
              {t(
                'privacy.contact.p',
                `If you have any questions about this Privacy Policy or our data practices, please contact us at ${PRIVACY_EMAIL}.`,
              )}
            </p>
          </ContentSection>
        </div>
      </PolicyDocumentLayout>
    </PageLayout>
  );
};

export default Privacy;
