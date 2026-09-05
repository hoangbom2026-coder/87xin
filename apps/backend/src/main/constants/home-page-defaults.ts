export interface IHomePageSection {
    id: string;
    enabled: boolean;
    order: number;
    title: string;
    subtitle: string;
    image: string;
    contentHtml: string;
    language: string;
}

export interface IHomePageMenuItem {
    id: string;
    label: string;
    href: string;
    enabled: boolean;
    order: number;
}

export interface IHomePageMenuGroup {
    id: string;
    label: string;
    order: number;
    items: IHomePageMenuItem[];
}

export interface IHomePageConfig {
    sections: IHomePageSection[];
    menuGroups: IHomePageMenuGroup[];
    imageSlots: Array<{
        id: string;
        label: string;
        image: string;
        enabled: boolean;
        language: string;
    }>;
}

const DEFAULT_HOME_PAGE: IHomePageConfig = {
    sections: [
        {
            id: 'siteHeroContentBanner',
            enabled: true,
            order: 10,
            title: 'Welcome To Our Platform',
            subtitle: 'Enjoy variety of casino games, fast payouts and 24/7 support.',
            image: '',
            contentHtml: '',
            language: 'en'
        },
        /** Legacy alias hero — tắt mặc định để không trùng 2 khối `.intro` (frontend gom slot `hero`). */
        { id: 'banner', enabled: false, order: 20, title: 'Main Banner', subtitle: '', image: '', contentHtml: '', language: 'en' },
        { id: 'gameLists', enabled: true, order: 30, title: 'Lobby', subtitle: '', image: '', contentHtml: '', language: 'en' },
        { id: 'gameLink', enabled: true, order: 40, title: 'Categories', subtitle: '', image: '', contentHtml: '', language: 'en' },
        { id: 'gameCategories', enabled: true, order: 50, title: 'Lobby Tabs', subtitle: '', image: '', contentHtml: '', language: 'en' },
        { id: 'playerGames', enabled: true, order: 60, title: 'In-house', subtitle: '', image: '', contentHtml: '', language: 'en' },
        { id: 'categoryRows', enabled: true, order: 70, title: 'Slots / Live / Fishing', subtitle: '', image: '', contentHtml: '', language: 'en' },
        { id: 'categoryOverview', enabled: true, order: 80, title: 'Providers', subtitle: '', image: '', contentHtml: '', language: 'en' },
        { id: 'livestreamSection', enabled: true, order: 90, title: 'Live', subtitle: '', image: '', contentHtml: '', language: 'en' },
        { id: 'popularSection', enabled: true, order: 100, title: 'Hot Games', subtitle: '', image: '', contentHtml: '', language: 'en' },
        { id: 'partnersRow', enabled: true, order: 110, title: 'Providers', subtitle: '', image: '', contentHtml: '', language: 'en' },
        { id: 'promotionsSection', enabled: true, order: 120, title: 'Promotions', subtitle: '', image: '', contentHtml: '', language: 'en' },
        { id: 'topWinnerTicker', enabled: true, order: 130, title: 'Top Winners', subtitle: '', image: '', contentHtml: '', language: 'en' },
        { id: 'payment', enabled: true, order: 140, title: 'Deposit', subtitle: '', image: '', contentHtml: '', language: 'en' },
        { id: 'dashTable', enabled: true, order: 150, title: 'Battle / Challenge', subtitle: '', image: '', contentHtml: '', language: 'en' }
    ],
    menuGroups: [
        {
            id: 'lobby',
            label: 'Lobby',
            order: 10,
            items: [
                { id: 'lobby-all', label: 'Lobby', href: '/casino/lobby', enabled: true, order: 10 },
                { id: 'lobby-slots', label: 'Slots', href: '/slot-games', enabled: true, order: 20 },
                { id: 'lobby-live', label: 'Live', href: '/live-casino', enabled: true, order: 30 },
                { id: 'lobby-fishing', label: 'Fishing', href: '/casino/fishing', enabled: true, order: 40 }
            ]
        }
    ],
    imageSlots: [
        { id: 'header-logo', label: 'Header Logo', image: '', enabled: true, language: 'en' },
        { id: 'hero-background', label: 'Hero Background', image: '', enabled: true, language: 'en' },
        { id: 'hero-main-banner', label: 'Hero Main Banner', image: '', enabled: true, language: 'en' },
        { id: 'step-register-icon', label: 'Step Register Icon', image: '', enabled: true, language: 'en' },
        { id: 'step-deposit-icon', label: 'Step Deposit Icon', image: '', enabled: true, language: 'en' },
        { id: 'step-play-icon', label: 'Step Play Icon', image: '', enabled: true, language: 'en' },
        { id: 'step-win-icon', label: 'Step Win Icon', image: '', enabled: true, language: 'en' },
        { id: 'promotion-cover-1', label: 'Promotion Cover 1', image: '', enabled: true, language: 'en' },
        { id: 'promotion-cover-2', label: 'Promotion Cover 2', image: '', enabled: true, language: 'en' },
        { id: 'promotion-cover-3', label: 'Promotion Cover 3', image: '', enabled: true, language: 'en' },
        { id: 'lobby-category-bg', label: 'Lobby Category Background', image: '', enabled: true, language: 'en' },
        { id: 'lobby-tab-lobby', label: 'Lobby Tab: Lobby', image: '', enabled: true, language: 'en' },
        { id: 'lobby-tab-inhouse', label: 'Lobby Tab: In-house', image: '', enabled: true, language: 'en' },
        { id: 'lobby-tab-slots', label: 'Lobby Tab: Slots', image: '', enabled: true, language: 'en' },
        { id: 'lobby-tab-live', label: 'Lobby Tab: Live', image: '', enabled: true, language: 'en' },
        { id: 'lobby-tab-fishing', label: 'Lobby Tab: Fishing', image: '', enabled: true, language: 'en' },
        { id: 'lobby-tab-special', label: 'Lobby Tab: Special', image: '', enabled: true, language: 'en' },
        { id: 'daily-challenge-banner', label: 'Daily Challenge Banner', image: '', enabled: true, language: 'en' },
        { id: 'daily-challenge-avatar-1', label: 'Daily Challenge Avatar 1', image: '', enabled: true, language: 'en' },
        { id: 'daily-challenge-avatar-2', label: 'Daily Challenge Avatar 2', image: '', enabled: true, language: 'en' },
        { id: 'daily-challenge-avatar-3', label: 'Daily Challenge Avatar 3', image: '', enabled: true, language: 'en' },
        { id: 'providers-strip', label: 'Providers Strip', image: '', enabled: true, language: 'en' },
        { id: 'footer-logo', label: 'Footer Logo', image: '', enabled: true, language: 'en' },
        { id: 'footer-social-facebook', label: 'Footer Social Facebook Icon', image: '', enabled: true, language: 'en' },
        { id: 'footer-social-telegram', label: 'Footer Social Telegram Icon', image: '', enabled: true, language: 'en' },
        { id: 'footer-social-twitter', label: 'Footer Social X Icon', image: '', enabled: true, language: 'en' },
        { id: 'footer-social-instagram', label: 'Footer Social Instagram Icon', image: '', enabled: true, language: 'en' }
    ]
};

const toNumber = (value: unknown, fallback: number) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
};

export const normalizeHomePage = (input?: Partial<IHomePageConfig> | null): IHomePageConfig => {
    if (!input || typeof input !== 'object') return DEFAULT_HOME_PAGE;

    const sectionDefaults = new Map(DEFAULT_HOME_PAGE.sections.map((row) => [row.id, row]));
    const sections =
        Array.isArray(input.sections) && input.sections.length > 0
            ? input.sections.map((row, idx) => {
                  const id = String(row?.id ?? '');
                  const fallback = sectionDefaults.get(id) || DEFAULT_HOME_PAGE.sections[idx] || DEFAULT_HOME_PAGE.sections[0];
                  return {
                      id: id || fallback.id,
                      enabled: row?.enabled !== undefined ? Boolean(row.enabled) : fallback.enabled,
                      order: toNumber(row?.order, fallback.order),
                      title: row?.title !== undefined ? String(row.title) : fallback.title,
                      subtitle: row?.subtitle !== undefined ? String(row.subtitle) : fallback.subtitle,
                      image: row?.image !== undefined ? String(row.image) : fallback.image,
                      contentHtml: row?.contentHtml !== undefined ? String(row.contentHtml) : fallback.contentHtml,
                      language: row?.language !== undefined ? String(row.language) : fallback.language
                  };
              })
            : DEFAULT_HOME_PAGE.sections;

    const menuGroups =
        Array.isArray(input.menuGroups) && input.menuGroups.length > 0
            ? input.menuGroups.map((group, gi) => {
                  const fallback = DEFAULT_HOME_PAGE.menuGroups[gi] || DEFAULT_HOME_PAGE.menuGroups[0];
                  const items =
                      Array.isArray(group?.items) && group.items.length > 0
                          ? group.items.map((item, ii) => {
                                const fallbackItem = fallback.items[ii] || fallback.items[0];
                                return {
                                    id: String(item?.id ?? fallbackItem.id),
                                    label: item?.label !== undefined ? String(item.label) : fallbackItem.label,
                                    href: item?.href !== undefined ? String(item.href) : fallbackItem.href,
                                    enabled: item?.enabled !== undefined ? Boolean(item.enabled) : fallbackItem.enabled,
                                    order: toNumber(item?.order, fallbackItem.order)
                                };
                            })
                          : fallback.items;
                  return {
                      id: String(group?.id ?? fallback.id),
                      label: group?.label !== undefined ? String(group.label) : fallback.label,
                      order: toNumber(group?.order, fallback.order),
                      items
                  };
              })
            : DEFAULT_HOME_PAGE.menuGroups;

    const slotDefaults = new Map(DEFAULT_HOME_PAGE.imageSlots.map((row) => [row.id, row]));
    const imageSlots =
        Array.isArray(input.imageSlots) && input.imageSlots.length > 0
            ? input.imageSlots.map((slot, idx) => {
                  const id = String(slot?.id ?? '');
                  const fallback = slotDefaults.get(id) || DEFAULT_HOME_PAGE.imageSlots[idx] || DEFAULT_HOME_PAGE.imageSlots[0];
                  return {
                      id: id || fallback.id,
                      label: slot?.label !== undefined ? String(slot.label) : fallback.label,
                      image: slot?.image !== undefined ? String(slot.image) : fallback.image,
                      enabled: slot?.enabled !== undefined ? Boolean(slot.enabled) : fallback.enabled,
                      language: slot?.language !== undefined ? String(slot.language) : fallback.language
                  };
              })
            : DEFAULT_HOME_PAGE.imageSlots;

    return { sections, menuGroups, imageSlots };
};
