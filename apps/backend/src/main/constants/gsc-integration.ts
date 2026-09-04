/**
 * GSC+ Seamless Wallet v2.0.6 — mapping API -> DB -> lobby FE.
 */

export const GSC_CONFIG = {
    opCode: process.env.GSC_OP_CODE || 'G7N1',
    secretKey: process.env.GSC_SECRET_KEY || 'krUWd6ZYgPKcUEZQN8KDxf',
    baseUrl: process.env.GSC_ENV === 'staging'
        ? 'https://stagingapi.gsimw.com'
        : 'https://api.gsimw.com'
} as const;

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

export const GSC_LANG_VI = '7';
