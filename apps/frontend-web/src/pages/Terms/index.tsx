import * as React from 'react';
import PageLayout from '../../components/ui/PageLayout';
import PolicyDocumentLayout from '../../components/layout/PolicyDocumentLayout';
import PolicyList from '../../components/ui/PolicyList';
import ContentSection from '../../components/ui/ContentSection';
import { useLanguage } from '../../i18n/LanguageContext';
import { cn } from '../../lib/cn';
import { PAGE_PROSE_BODY_CLASS, MARKETING_LP_SHELL_CLASS, MARKETING_SECTION_STACK_CLASS } from '../../constants/pageShell';
import { PUBLIC_IMAGES } from '../../constants/publicAssets';

const Terms: React.FC = () => {
  const { t } = useLanguage();

  const termsItems = [
    {
      title: t('terms.item1.title', '1. Eligibility'),
      content: t('terms.item1.p', 'You must be at least 18 years of age or the legal age for gambling in your jurisdiction to use our services. By using our platform, you represent and warrant that you meet these eligibility requirements.')
    },
    {
      title: t('terms.item2.title', '2. Account Registration'),
      content: t('terms.item2.p', 'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate and complete information during registration.')
    },
    {
      title: t('terms.item3.title', '3. Prohibited Activities'),
      content: t('terms.item3.p', 'Users are prohibited from engaging in fraudulent activities, money laundering, or any behavior that compromises the integrity of our games. We reserve the right to suspend or terminate accounts found in violation.')
    },
    {
      title: t('terms.item4.title', '4. Deposits and Withdrawals'),
      content: t('terms.item4.p', 'All financial transactions are subject to verification and our standard processing times. We reserve the right to request documentation for identity verification purposes.')
    },
    {
      title: t('terms.item5.title', '5. Limitation of Liability'),
      content: t('terms.item5.p', 'Cuocbong99 shall not be liable for any direct, indirect, or incidental damages resulting from the use or inability to use our services, including but not limited to financial losses.')
    }
  ];

  return (
    <PageLayout>
      <PolicyDocumentLayout
        title={t('terms.title', 'TERMS OF')}
        highlight={t('terms.highlight', 'SERVICE')}
        subtitle={t('terms.subtitle', 'The legal agreement between you and our platform')}
        icon={PUBLIC_IMAGES.policy.privacyTerms}
      >
        <div className={cn(MARKETING_LP_SHELL_CLASS, MARKETING_SECTION_STACK_CLASS)}>
          <ContentSection title={t('terms.intro.title', 'Agreement to Terms')}>
            <p className={PAGE_PROSE_BODY_CLASS}>
              {t('terms.intro.p', 'By accessing or using Cuocbong99, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not use our platform.')}
            </p>
          </ContentSection>

          <PolicyList items={termsItems} />

          <ContentSection title={t('terms.mod.title', 'Modifications')} className="border-primary/20 bg-primary/5">
            <p className={PAGE_PROSE_BODY_CLASS}>
              {t('terms.mod.p', 'We reserve the right to modify these terms at any time. Any changes will be effective immediately upon posting. Your continued use of the platform after changes are posted constitutes your acceptance of the new terms.')}
            </p>
          </ContentSection>
        </div>
      </PolicyDocumentLayout>
    </PageLayout>
  );
};

export default Terms;
