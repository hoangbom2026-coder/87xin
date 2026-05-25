/**
 * GSC+ Seamless Wallet v2.0.6 — mapping API → DB → lobby FE.
 *
 * §3.6 `available-products`
 *   → 1 dòng = (`product_code`, `game_type`, `provider`, `entry_type`, `status`)
 *   → `entry_type`: 1 = cần `game_code` khi launch; 2 = chỉ lobby
 *
 * §3.4 `provider-games?product_code=&game_type=`
 *   → `provider_games[]`: cùng `game_code` có thể lặp theo `support_currency`
 *   → `status`: `ACTIVAT` / `ACTIVATED` / `DEACTIVATED` / `MAINTAINED`
 *   → ảnh: `image_url` hoặc `lang_icon` (key `7` = tiếng Việt)
 *   → `pagination.total` có thể là string (`"2000"`) — sync phải paginate offset
 *
 * §3.1 `launch-game`: `product_code` + `game_type` + `currency`; `game_code` nếu entry_type=1
 *
 * Sync app: `syncGscEnvironmentCatalog` = §3.6 rồi §3.4 từng cặp ACTIVATED; cron 00:00 = full sync.
 */

export const GSC_API = {
    productList: '/api/operators/available-products',
    gameList: '/api/operators/provider-games',
    launchGame: '/api/operators/launch-game',
    gameHistory: '/api/operators/{wager_code}/game-history'
} as const;

export const GSC_ENTRY_TYPE = {
    DIRECT_GAME: 1,
    LOBBY_ONLY: 2
} as const;

/** Language code GSC — ảnh/tên game (§3.4 lang_icon). */
export const GSC_LANG_VI = '7';
