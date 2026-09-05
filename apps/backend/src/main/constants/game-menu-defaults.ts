/** Game menu defaults — cấu hình menu hiển thị lobby */
export interface IGameMenuItem {
    id: string;
    label: string;
    icon?: string;
    type: 'slot' | 'casino' | 'sport' | 'fish' | 'link' | 'group';
    children?: IGameMenuItem[];
    order?: number;
    enabled?: boolean;
    [key: string]: any;
}

export const GAME_MENU_DEFAULTS: IGameMenuItem[] = [
    {
        id: 'slots',
        label: 'Slots',
        type: 'slot',
        order: 1,
        enabled: true
    },
    {
        id: 'casino',
        label: 'Live Casino',
        type: 'casino',
        order: 2,
        enabled: true
    },
    {
        id: 'sports',
        label: 'Sports',
        type: 'sport',
        order: 3,
        enabled: true
    },
    {
        id: 'fish',
        label: 'Fish Games',
        type: 'fish',
        order: 4,
        enabled: true
    }
];

/** Default menu items (alias chuẩn) */
export const DEFAULT_GAME_MENU: IGameMenuItem[] = GAME_MENU_DEFAULTS;

/** Normalize game menu: đảm bảo cấu trúc hợp lệ */
export const normalizeGameMenu = (items: IGameMenuItem[]): IGameMenuItem[] => {
    if (!Array.isArray(items)) return DEFAULT_GAME_MENU;
    return items.map((item, idx) => ({
        ...item,
        order: item.order ?? idx,
        enabled: item.enabled ?? true
    }));
};

export default GAME_MENU_DEFAULTS;