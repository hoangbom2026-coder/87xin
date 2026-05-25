import * as React from 'react';
import PageLayout from '../../components/ui/PageLayout';
import PolicyDocumentLayout from '../../components/layout/PolicyDocumentLayout';
import ContentSection from '../../components/ui/ContentSection';
import Button from '../../components/ui/Button';
import { cn } from '../../lib/cn';
import { useLanguage } from '../../i18n/LanguageContext';
import { PAGE_PROSE_BODY_CLASS, PAGE_PROSE_BODY_SM_CLASS, MARKETING_LP_SHELL_CLASS, MARKETING_SECTION_STACK_CLASS } from '../../constants/pageShell';
import { PUBLIC_IMAGES } from '../../constants/publicAssets';
import { POLICY_TWO_COLUMN_GRID_CLASS } from '../../constants/layoutGrids';

const ResponsibleGaming: React.FC = () => {
  const { t } = useLanguage();

  const warningSigns = [
    t('responsible.signs.item1', 'Spending more money on gaming than you can afford to lose.'),
    t('responsible.signs.item2', 'Gaming interfering with your daily responsibilities or relationships.'),
    t('responsible.signs.item3', 'Chasing losses to try and win back money.'),
    t('responsible.signs.item4', 'Feeling restless or irritable when trying to cut down on gaming.'),
  ];

  return (
    <PageLayout>
      <PolicyDocumentLayout
        title={t('responsible.title', 'RESPONSIBLE')}
        highlight={t('responsible.highlight', 'GAMING')}
        subtitle={t('responsible.subtitle', 'Play safe, stay in control, and enjoy the experience')}
        icon={PUBLIC_IMAGES.policy.responsible}
      >
        <div className={cn(MARKETING_LP_SHELL_CLASS, MARKETING_SECTION_STACK_CLASS)}>
          <ContentSection title={t('responsible.commitment.title', 'Our Commitment')}>
            <p className={PAGE_PROSE_BODY_CLASS}>
              {t('responsible.commitment.p', 'At Cuocbong99, we are dedicated to providing a responsible gaming environment. We want our players to enjoy our games in a safe and controlled manner. Gaming should always be viewed as a form of entertainment, not a way to make money.')}
            </p>
          </ContentSection>

          <div className={POLICY_TWO_COLUMN_GRID_CLASS}>
            <ContentSection className="border-primary/20 bg-primary/5">
              <h3 className="mb-4 text-balance font-black uppercase italic text-token-h3 text-white">
                {t('responsible.limits.title', 'Set Limits')}
              </h3>
              <p className={PAGE_PROSE_BODY_SM_CLASS}>
                {t('responsible.limits.p', 'Take control of your gaming by setting daily, weekly, or monthly deposit and loss limits.')}
              </p>
            </ContentSection>
            <ContentSection className="border-primary/20 bg-primary/5">
              <h3 className="mb-4 text-balance font-black uppercase italic text-token-h3 text-white">
                {t('responsible.break.title', 'Take a Break')}
              </h3>
              <p className={PAGE_PROSE_BODY_SM_CLASS}>
                {t('responsible.break.p', 'Use our self-exclusion tools if you feel you need to take a break from gaming for a specific period.')}
              </p>
            </ContentSection>
          </div>

          <ContentSection title={t('responsible.signs.title', 'Signs of Problem Gaming')}>
            <ul className="space-y-4">
              {warningSigns.map((tip, i) => (
                <li key={i} className={cn('flex items-start gap-4', PAGE_PROSE_BODY_SM_CLASS)}>
                  <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary shadow-glow-primary" />
                  {tip}
                </li>
              ))}
            </ul>
          </ContentSection>

          <ContentSection className="border-primary/20 bg-primary/5 text-center">
            <h2 className="mb-4 text-balance font-black uppercase italic text-token-h2 text-white">
              {t('responsible.help.title', 'Need Help?')}
            </h2>
            <p className={cn(PAGE_PROSE_BODY_CLASS, 'mb-8')}>
              {t('responsible.help.p', 'If you or someone you know is struggling with gaming addiction, please reach out to professional support organizations.')}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="premium" size="lg" className="italic !px-10">
                {t('responsible.help.contact', 'Contact Support')}
              </Button>
              <Button variant="outline" size="lg" className="italic !px-10">
                GamCare Website
              </Button>
            </div>
          </ContentSection>
        </div>
      </PolicyDocumentLayout>
    </PageLayout>
  );
};

export default ResponsibleGaming;
