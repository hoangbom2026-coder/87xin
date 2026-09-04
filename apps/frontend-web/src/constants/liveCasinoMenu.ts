/**
 * Navigation aliases and provider shortcuts for Live Casino lobby.
 */

export interface LiveCasinoAlias {
  key: string;
  to: string;
  end?: boolean;
  icon: string;
  name: string;
}

export const LIVE_CASINO_ALIASES: LiveCasinoAlias[] = [
  {
    key: 'all',
    to: '/live-casino',
    end: true,
    icon: '/images/pages/live-casino/sanh-live.webp',
    name: 'Tất Cả',
  },
  {
    key: 'sexy',
    to: '/live-casino?provider=sexy',
    icon: '/images/pages/live-casino/sexy.webp',
    name: 'SE Baccarat',
  },
  {
    key: 'dg',
    to: '/live-casino?provider=dg',
    icon: '/images/pages/live-casino/dg.webp',
    name: 'Dream Gaming',
  },
  {
    key: 'wm',
    to: '/live-casino?provider=wm',
    icon: '/images/pages/live-casino/wm.webp',
    name: 'WM Casino',
  },
  {
    key: 'evo',
    to: '/live-casino?provider=evo',
    icon: '/images/pages/live-casino/evo.webp',
    name: 'Evolution',
  },
  {
    key: 'ag',
    to: '/live-casino?provider=ag',
    icon: '/images/pages/live-casino/ag.webp',
    name: 'Asia Gaming',
  },
];
