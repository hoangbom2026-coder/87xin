import type { DailyChallengeItem } from '../../services/challengeService'

const inDays = (d: number) => new Date(Date.now() + d * 864e5).toISOString()

/** Dữ liệu mẫu + ảnh SVG cố định khi API chưa trả hoặc thiếu slide. */
export const DAILY_CHALLENGE_FALLBACKS: DailyChallengeItem[] = [
  {
    id: 'fallback-1',
    image: '/images/banners/challenge/challenge_1.jpg',
    title: 'Pragmatic Play Multipliers',
    prize: '$ 10 000',
    endTime: inDays(3),
    rankings: [
      { name: 'Gorden', multiplier: '2020.91', reward: '$3,000', points: '+3 500 points', placeImg: '' },
      { name: 'SilverFox', multiplier: '1842.10', reward: '$2,000', points: '+2 100 points', placeImg: '' },
      { name: 'AceKing', multiplier: '1600.00', reward: '$1,000', points: '+1 800 points', placeImg: '' },
    ],
  },
  {
    id: 'fallback-2',
    image: '/images/banners/challenge/challenge_2.jpg',
    title: 'Go Wild With Me!',
    prize: '$ 30 000',
    endTime: inDays(5),
    rankings: [
      { name: 'Luna', multiplier: '3100.00', reward: '$8,000', points: '+4 200 points', placeImg: '' },
      { name: 'Neo', multiplier: '2901.55', reward: '$5,000', points: '+3 000 points', placeImg: '' },
      { name: 'Viper', multiplier: '2400.00', reward: '$3,000', points: '+2 400 points', placeImg: '' },
    ],
  },
  {
    id: 'fallback-3',
    image: '/images/banners/challenge/challenge_3.jpg',
    title: 'Win Streak Classic',
    prize: '$ 5 000',
    endTime: inDays(1),
    rankings: [
      { name: 'Bolt', multiplier: '980.20', reward: '$1,500', points: '+900 points', placeImg: '' },
      { name: 'Mia', multiplier: '850.00', reward: '$1,000', points: '+700 points', placeImg: '' },
      { name: 'Zen', multiplier: '720.10', reward: '$500', points: '+500 points', placeImg: '' },
    ],
  },
]
