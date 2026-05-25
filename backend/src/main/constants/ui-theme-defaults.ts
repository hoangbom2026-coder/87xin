/**
 * Màu / token theme mặc định dự án 9Bet — lưu ghi đè tại `settings.uiTheme` + admin Themes.
 * Không phụ thuộc bản mẫu từ repo khác; chỉnh tại Trung tâm điều khiển.
 */
export const DEFAULT_WEB_MAIN: Record<string, string> = {
    header: '#1B1A1A',
    'header-block': '#1B1A1A',
    body: '#080808',
    secondary: '#886cff',
    'secondary-2': '#d06fa0',
    'button-secondary': 'linear-gradient(to right, #886cff, #d06fa0)',
    'button-secondary-hover': 'linear-gradient(to right, #d06fa0, #886cff)',
    'button-dark': '#32322D',
    border: '#2F2D2D',
    'border-light': 'rgba(255, 255, 255, 0.15)',
    'border-secondary': '#59B6FF',
    shadow: 'none',
    block: '#32322D',
    block2: '#4a4945',
    block3: '#302f2a',
    block4: '#2e2d28',
    block5: '#2a2925',
    block6: '#2d2c27',
    block7: '#2b2a25',
    betSlipBackground: '#161722',
    'table-color': '#F2F2F2',
    wallet: '#0f1326',
    text: '#ffffff',
    textInverted: '#000000',
    sidebar: '#1B1A1A',
    chat: '#1B1A1A',
    'chat-accent': '#080808',
    'chat-message': '#1b1a1a',
    separator: '#151E29',
    link: '#F2F2F2',
    link2: '#F2F2F2',
    'link-hover': '#ffffff',
    // Frontend1 (Set52) specific keys
    'primary': '#ed1d49',
    'primary-hover': '#ff2d5a',
    'bg-main': '#191b1e',
    'bg-surface': '#24262b',
    'bg-sidebar': '#111923',
    'text-main': '#ffffff',
    'text-muted': '#93acd3',
    'text-gray': '#55657e',
    'border-main': 'rgba(255, 255, 255, 0.05)',
    input: '#32322D',
    'input-dark': '#1B1A1A',
    'input-placeholder': '#c8d0da',
    footer: '#1B1A1A',
    modal: '#1B1A1A',
    modal_input: '#1B1A1A',
    'profile-progress': '#18212D',
    'profile-footer': '#1B1A1A',
    progressBarColor1: '#89DB21',
    progressBarColor2: '#6FB517',
    progressBarColor3: '#28DBD5',
    progressBarColor4: '#1784E8',
    switchBackground: 'rgba(255, 255, 255, 0.15)',
    switchBackgroundDot: 'rgba(255, 255, 255, 0.15)',
    switchBackgroundOn: '#4bcb27',
    switchBackgroundDotOn: 'rgba(255, 255, 255, 0.4)',
    selectorArrow:
        "url(\"data:image/svg+xml;utf8,<svg fill='white' height='34' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>\")"
};

/** Theme dashboard `dark` — biến cho admin shell. */
export const DEFAULT_ADMIN_MAIN: Record<string, string> = {
    text: '#ffffff',
    secondary: '#9aa1ff',
    background: '#1a191e',
    sidebar: '#1c1b20',
    block: '#1c1b20',
    'block-2': '#201f25',
    border: '#201f25',
    link: '#cbcbcb',
    input: '#24232a',
    inputHover: '#29272f',
    switchBackground: 'rgba(255, 255, 255, 0.15)',
    switchBackgroundDot: 'rgba(255, 255, 255, 0.15)',
    switchBackgroundOn: '#4bcb27',
    switchBackgroundDotOn: 'rgba(255, 255, 255, 0.4)',
    criticalColor: '#ffaeae',
    criticalBorder: '#ef6262',
    infoColor: '#dcdeff',
    infoBorder: '#9aa1ff',
    warningColor: '#ffddbf',
    warningBorder: '#ffc99a',
    hovercolor: '#1B1A1A',
    gradientcolor: '#0c0c0c66'
};

export function mergeWebMain(stored?: Record<string, string> | null): Record<string, string> {
    return { ...DEFAULT_WEB_MAIN, ...(stored || {}) };
}

export function mergeAdminMain(stored?: Record<string, string> | null): Record<string, string> {
    return { ...DEFAULT_ADMIN_MAIN, ...(stored || {}) };
}
