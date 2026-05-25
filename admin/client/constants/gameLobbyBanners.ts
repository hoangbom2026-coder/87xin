/** Khớp category FE + `GamePageTemplate` (đồng bộ với frontend1). */
export const GAME_LOBBY_BANNER_KEYS = [
  'sports',
  'fishing',
  'lottery',
  'table',
  'poker',
  'slots',
  'live'
] as const

export type GameLobbyBannerKey = (typeof GAME_LOBBY_BANNER_KEYS)[number]

export const GAME_LOBBY_LABELS_VI: Record<GameLobbyBannerKey, string> = {
  sports: 'Đá gà / Thể thao',
  fishing: 'Bắn cá',
  lottery: 'Lô đề',
  table: 'Quay số / Table',
  poker: 'Game bài',
  slots: 'Slots',
  live: 'Live casino / Table games'
}
