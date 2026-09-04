import * as React from 'react'
import { ChevronRight, Trophy } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext'
import { PUBLIC_IMAGES } from '../../constants/publicAssets'

interface MatchOdds {
  label: string
  home: { value: string; odds: string }
  away: { value: string; odds: string }
}

interface Match {
  id: string
  league: string
  homeTeam: { name: string; logo?: string }
  awayTeam: { name: string; logo?: string }
  status: string
  odds: MatchOdds[]
}

const MOCK_MATCHES: Match[] = [
  {
    id: '1',
    league: 'Italy Serie B',
    homeTeam: { name: 'Modena', logo: 'https://d39mzzwe2ijlir.cloudfront.net/logo-team-1691935096095.png' },
    awayTeam: { name: 'Juve Stabia', logo: 'https://d39mzzwe2ijlir.cloudfront.net/logo-team-1729948820027.png' },
    status: 'Đang đá',
    odds: [
      { label: 'Kèo chấp', home: { value: '0.0', odds: '0.59' }, away: { value: '0.0', odds: '-0.77' } },
      { label: 'O / U', home: { value: '0.5', odds: '-0.99' }, away: { value: '0.5', odds: '0.79' } },
    ]
  },
  {
    id: '2',
    league: 'Egypt Premier League',
    homeTeam: { name: 'Wadi Degla' },
    awayTeam: { name: 'Ismaily SC' },
    status: 'Đang đá',
    odds: [
      { label: 'Kèo chấp', home: { value: '-0.25', odds: '0.83' }, away: { value: '0.25', odds: '0.99' } },
      { label: 'O / U', home: { value: '2.25', odds: '-0.94' }, away: { value: '2.25', odds: '0.74' } },
    ]
  },
  {
    id: '3',
    league: 'Sweden Superettan',
    homeTeam: { name: 'Landskrona' },
    awayTeam: { name: 'Norrby IF' },
    status: 'Đang đá',
    odds: [
      { label: 'Kèo chấp', home: { value: '-0.25', odds: '0.97' }, away: { value: '0.25', odds: '0.85' } },
      { label: 'O / U', home: { value: '2.25', odds: '0.98' }, away: { value: '2.25', odds: '0.82' } },
    ]
  },
  {
    id: '4',
    league: 'Sweden Superettan',
    homeTeam: { name: 'IFK Varnamo' },
    awayTeam: { name: 'Orebro' },
    status: 'Đang đá',
    odds: [
      { label: 'Kèo chấp', home: { value: '-0.25', odds: '-0.97' }, away: { value: '0.25', odds: '0.79' } },
      { label: 'O / U', home: { value: '1.0', odds: '0.94' }, away: { value: '1.0', odds: '0.86' } },
    ]
  },
  {
    id: '5',
    league: 'Spain La Liga',
    homeTeam: { name: 'Celta Vigo' },
    awayTeam: { name: 'Levante' },
    status: 'Đang đá',
    odds: [
      { label: 'Kèo chấp', home: { value: '0.0', odds: '0.79' }, away: { value: '0.0', odds: '-0.89' } },
      { label: 'O / U', home: { value: '4.25', odds: '0.93' }, away: { value: '4.25', odds: '0.95' } },
    ]
  }
]

const HotMatch: React.FC = () => {
  const { t } = useLanguage()

  return (
    <div className="hot-match-section">
      <a className="flex items-center gap-2 px-3 mb-3 group" href="/the-thao">
        <div className="flex items-center">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 ring-1 ring-primary/20">
            <img
              src={PUBLIC_IMAGES.badges.sportBall}
              alt=""
              className="h-6 w-6 object-contain"
              loading="lazy"
              width={24}
              height={24}
            />
          </div>
          <span className="ml-2 text-white text-base font-bold uppercase tracking-tight">
            {t('home.hotMatch', 'Top kèo bóng đá')}
          </span>
        </div>
        <ChevronRight className="text-primary group-hover:translate-x-1 transition-transform" size={20} />
      </a>

      <div className="relative">
        <div className="flex overflow-x-auto hide-scroll-bar gap-4 pb-4 px-3 snap-x snap-mandatory">
          {MOCK_MATCHES.map((match) => (
            <div
              key={match.id}
              className="min-w-[85%] md:min-w-[320px] snap-start flex flex-col rounded-xl overflow-hidden border border-white/5 bg-secondary-dark relative group cursor-pointer"
            >
              {/* Header */}
              <div className="relative h-8 flex items-center justify-between px-3 overflow-hidden">
                {/* Status Shape Background */}
                <div className="absolute left-0 top-0 h-full w-1/2 bg-gradient-to-r from-primary/40 to-transparent z-0" />

                <div className="z-10 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-token-xs font-bold text-primary-light uppercase whitespace-nowrap">
                    {match.status}
                  </span>
                </div>

                <div className="z-10 text-token-xs text-text-muted font-medium truncate max-w-[120px]">
                  {match.league}
                </div>
              </div>

              {/* VS Section */}
              <div className="flex items-center justify-center gap-4 py-3 px-4">
                <div className="flex-1 flex flex-col items-end text-right overflow-hidden">
                   <div className="w-8 h-8 mb-1 flex items-center justify-center bg-white/5 rounded-lg overflow-hidden">
                      {match.homeTeam.logo ? (
                        <img src={match.homeTeam.logo} alt={match.homeTeam.name} width={24} height={24} className="w-6 h-6 object-contain" />
                      ) : (
                        <div className="w-6 h-6 bg-primary/20 flex items-center justify-center text-token-xs font-bold">H</div>
                      )}
                   </div>
                   <span className="text-xs font-bold text-white truncate w-full">{match.homeTeam.name}</span>
                </div>

                <div className="flex flex-col items-center">
                   <span className="text-token-xs font-black text-primary italic">VS</span>
                </div>

                <div className="flex-1 flex flex-col items-start text-left overflow-hidden">
                   <div className="w-8 h-8 mb-1 flex items-center justify-center bg-white/5 rounded-lg overflow-hidden">
                      {match.awayTeam.logo ? (
                        <img src={match.awayTeam.logo} alt={match.awayTeam.name} width={24} height={24} className="w-6 h-6 object-contain" />
                      ) : (
                        <div className="w-6 h-6 bg-primary/20 flex items-center justify-center text-token-xs font-bold">A</div>
                      )}
                   </div>
                   <span className="text-xs font-bold text-white truncate w-full">{match.awayTeam.name}</span>
                </div>
              </div>

              {/* Divider */}
              <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

              {/* Odds Grid */}
              <div className="grid grid-cols-3 gap-1 p-3">
                {/* Home Odds */}
                <div className="flex flex-col gap-1">
                  {match.odds.map((odd, idx) => (
                    <div key={idx} className="h-6 flex items-center justify-between px-2 rounded bg-white/5 border border-white/5">
                      <span className="text-token-xs text-text-muted">{odd.home.value}</span>
                      <span className="text-token-xs font-bold text-green-400">{odd.home.odds}</span>
                    </div>
                  ))}
                </div>

                {/* Labels */}
                <div className="flex flex-col gap-1">
                  {match.odds.map((odd, idx) => (
                    <div key={idx} className="h-6 flex items-center justify-center rounded bg-gradient-to-r from-white/0 via-white/5 to-white/0">
                      <span className="text-[9px] font-black text-text-muted uppercase">{odd.label}</span>
                    </div>
                  ))}
                </div>

                {/* Away Odds */}
                <div className="flex flex-col gap-1">
                  {match.odds.map((odd, idx) => (
                    <div key={idx} className="h-6 flex items-center justify-between px-2 rounded bg-white/5 border border-white/5">
                      <span className="text-token-xs text-text-muted">{odd.away.value}</span>
                      <span className="text-token-xs font-bold text-red-400">{odd.away.odds}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating WC Icon Decoration */}
              <div className="absolute -bottom-2 -right-1 opacity-20 group-hover:opacity-40 transition-opacity">
                 <Trophy size={48} className="text-white rotate-12" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .hide-scroll-bar::-webkit-scrollbar {
          display: none;
        }
        .hide-scroll-bar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  )
}

export default HotMatch
