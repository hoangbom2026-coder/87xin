import * as React from 'react'
import { useLanguage } from '../../i18n/LanguageContext'
import { useCountdownTo } from '../../hooks/useCountdownTo'

const KEYS = ['days', 'hours', 'mins', 'secs'] as const

interface DailyChallengeCountdownProps {
  endTime: string
}

const DailyChallengeCountdown: React.FC<DailyChallengeCountdownProps> = ({ endTime }) => {
  const { t } = useLanguage()
  const { days, hours, mins, secs, expired } = useCountdownTo(endTime)

  const partLabel: Record<(typeof KEYS)[number], string> = {
    days: t('home.days', 'Days'),
    hours: t('home.hours', 'Hours'),
    mins: t('home.mins', 'Min'),
    secs: t('home.secs', 'Sec'),
  }

  const values = { days, hours, mins, secs }

  return (
    <div className="battle_card_timer" aria-live="polite">
      <div className="battle_card_label">
        {expired ? t('home.challengeEnded', 'Ended') : t('home.endsIn', 'Ends in')}
      </div>
      {KEYS.map((key, idx) => (
        <React.Fragment key={key}>
          <div className="battle_card_timer_block">
            <div className="battle_card_block_value">{values[key]}</div>
            <div className="battle_card_block_name">{partLabel[key]}</div>
          </div>
          {idx < KEYS.length - 1 && <div className="battle_card_timer_dot">:</div>}
        </React.Fragment>
      ))}
    </div>
  )
}

export default DailyChallengeCountdown
