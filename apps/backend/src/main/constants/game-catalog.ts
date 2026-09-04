/**
 * Catalog game của hệ thống — categories và kinds (Stake-style).
 * Dùng cho admin Game Hub: lọc, sắp xếp, hiển thị pill subcategory.
 */

export const GAME_CATEGORIES = [
    { key: 'slots', label: 'Slots', color: '#16a34a' },
    { key: 'live_casino', label: 'Live Casino', color: '#dc2626' },
    { key: 'new_releases', label: 'New Releases', color: '#0ea5e9' },
    { key: 'game_shows', label: 'Game Shows', color: '#a855f7' },
    { key: 'originals', label: 'Originals', color: '#f59e0b' },
    { key: 'sports', label: 'Sport', color: '#0891b2' },
    { key: 'lottery', label: 'Lottery', color: '#ea580c' }
] as const;
export type GameCategoryKey = (typeof GAME_CATEGORIES)[number]['key'];
export const GAME_CATEGORY_KEYS: GameCategoryKey[] = GAME_CATEGORIES.map((c) => c.key);

/** Kind = sub-type (Mines, Dice, Plinko ... áp dụng cho originals; với slot/live_casino có thể trống). */
export const GAME_KINDS = [
    'mines',
    'dice',
    'plinko',
    'slot',
    'crash',
    'wheel',
    'blackjack',
    'coinflip',
    'keno',
    'tower',
    'stairs',
    'diamonds',
    'roulette',
    'baccarat',
    'sicbo',
    'fishing',
    'other'
] as const;
export type GameKind = (typeof GAME_KINDS)[number];
export const GAME_KIND_SET = new Set<GameKind>(GAME_KINDS);

/**
 * Game Originals mặc định — sẽ được seed vào DB khi chưa tồn tại (theo gameKey).
 */
export interface ISeedGame {
    gameKey: string;
    name: string;
    category: GameCategoryKey;
    kind: GameKind;
    image?: string;
    description?: string;
    enabled: boolean;
    visible: boolean;
    featured: boolean;
    favorite: boolean;
    searchable: boolean;
}

export const SEED_ORIGINALS: ISeedGame[] = [
    {
        gameKey: 'originals_mines',
        name: 'Mines',
        category: 'originals',
        kind: 'mines',
        image: '/images/games/originals/mines.webp',
        description: 'Tìm đá quý, tránh mìn — xác suất tự cấu hình.',
        enabled: true,
        visible: true,
        featured: true,
        favorite: false,
        searchable: true
    },
    {
        gameKey: 'originals_dice',
        name: 'Dice',
        category: 'originals',
        kind: 'dice',
        image: '/images/games/originals/dice.webp',
        description: 'Tung xúc xắc — over/under tự chọn.',
        enabled: true,
        visible: true,
        featured: false,
        favorite: false,
        searchable: true
    },
    {
        gameKey: 'originals_plinko',
        name: 'Plinko',
        category: 'originals',
        kind: 'plinko',
        image: '/images/games/originals/plinko.webp',
        description: 'Thả bóng theo trọng lực, rơi vào ô số nhân.',
        enabled: true,
        visible: true,
        featured: true,
        favorite: false,
        searchable: true
    },
    {
        gameKey: 'originals_crash',
        name: 'Crash',
        category: 'originals',
        kind: 'crash',
        image: '/images/games/originals/crash.webp',
        description: 'Cash-out trước khi nổ.',
        enabled: true,
        visible: true,
        featured: true,
        favorite: false,
        searchable: true
    },
    {
        gameKey: 'originals_wheel',
        name: 'Wheel',
        category: 'originals',
        kind: 'wheel',
        image: '/images/games/originals/wheel.webp',
        description: 'Vòng quay nhân thưởng.',
        enabled: true,
        visible: true,
        featured: false,
        favorite: false,
        searchable: true
    },
    {
        gameKey: 'originals_blackjack',
        name: 'Blackjack',
        category: 'originals',
        kind: 'blackjack',
        image: '/images/games/originals/blackjack.webp',
        description: 'Xì dách — đối đầu nhà cái RNG.',
        enabled: true,
        visible: true,
        featured: false,
        favorite: false,
        searchable: true
    },
    {
        gameKey: 'originals_coinflip',
        name: 'Coinflip',
        category: 'originals',
        kind: 'coinflip',
        image: '/images/games/originals/coinflip.webp',
        description: 'Tung đồng xu sấp/ngửa.',
        enabled: true,
        visible: true,
        featured: false,
        favorite: false,
        searchable: true
    },
    {
        gameKey: 'originals_keno',
        name: 'Keno',
        category: 'originals',
        kind: 'keno',
        image: '/images/games/originals/keno.webp',
        description: 'Chọn số trúng giải.',
        enabled: true,
        visible: true,
        featured: false,
        favorite: false,
        searchable: true
    },
    {
        gameKey: 'originals_tower',
        name: 'Tower',
        category: 'originals',
        kind: 'tower',
        image: '/images/games/originals/tower.webp',
        description: 'Leo tháp — chọn cửa an toàn.',
        enabled: true,
        visible: true,
        featured: false,
        favorite: false,
        searchable: true
    },
    {
        gameKey: 'originals_stairs',
        name: 'Stairs',
        category: 'originals',
        kind: 'stairs',
        image: '/images/games/originals/stairs.webp',
        description: 'Bước lên cầu thang nhân thưởng.',
        enabled: true,
        visible: true,
        featured: false,
        favorite: false,
        searchable: true
    },
    {
        gameKey: 'originals_diamonds',
        name: 'Diamonds',
        category: 'originals',
        kind: 'diamonds',
        image: '/images/games/originals/diamonds.webp',
        description: 'Mở thẻ tìm kim cương cùng màu.',
        enabled: true,
        visible: true,
        featured: false,
        favorite: false,
        searchable: true
    }
];
