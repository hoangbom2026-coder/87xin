/** Đồng bộ với backend `ui-theme-defaults.ts` — token theme site + admin. */

export const DEFAULT_WEB_MAIN: Record<string, string> = {
  /* Layout Dimensions */
  "sidebar-width": "240px",
  "header-height": "64px",
  "mobile-nav-height": "60px",
  "sidebar-transition": "0.3s cubic-bezier(0.4, 0, 0.2, 1)",

  /* Banner Heights */
  "banner-page-h-sm": "220px",
  "banner-page-h-md": "291px",
  "banner-sidebar-min-h": "280px",
  "banner-sidebar-max-h": "420px",

  /* Spacing */
  "fluid-gap": "12px",
  "fluid-padding": "12px",
  "section-gap": "24px",
  "section-gap-mobile": "16px",

  /* Typography */
  "font-size-base": "15px",
  "font-size-h1": "32px",
  "font-size-h2": "22px",
  "font-size-h3": "19px",
  "font-size-h4": "17px",
  "font-size-sm": "12px",
  "font-size-xs": "11px",

  /* Colors - Backgrounds */
  "bg-main": "#0b0e11",
  "bg-surface": "#161a1e",
  "bg-sidebar": "#090c0f",

  /* Colors - Surfaces */
  "surface-1": "#24262b",
  "surface-2": "#2c2e34",
  "surface-3": "#36383e",
  "surface-dark": "#171f2b",
  "surface-footer": "#161f2c",
  "surface-input": "rgba(0, 0, 0, 0.3)",

  /* Colors - Brand */
  "primary": "#2283f6",
  "primary-hover": "#1d72d6",
  "secondary": "#2283f6",
  "accent": "#ed1d49",
  "accent-hover": "#eb3b60",
  "warning": "#f4ba00",
  "success": "#1cc980",

  /* Colors - Text */
  "text-main": "#ffffff",
  "text-muted": "#93acd3",
  "text-gray": "#55657e",
  "text-soft": "#ecf1ffb3",

  /* Colors - Borders */
  "border-main": "transparent",
  "border-input": "#475c72",
  "border-divider": "#dee3f026",
  "border-soft": "rgba(85, 101, 126, 0.15)",

  /* Legacy / Compat */
  "color-mirage-2": "#1a222e",
  "color-mirage-3": "#17212b",
  "color-nepal": "#93acd3",
  "color-turquoise-blue": "#4be2eb",
  "text-shadow-glow": "0 0 10px rgba(34, 131, 246, 0.4)",

  header: "#1B1A1A",
  body: "#080808",
  footer: "#1B1A1A",
};

export const DEFAULT_ADMIN_MAIN: Record<string, string> = {
  text: "#ffffff",
  secondary: "#9aa1ff",
  background: "#1a191e",
  sidebar: "#1c1b20",
  block: "#1c1b20",
  "block-2": "#201f25",
  border: "#201f25",
  link: "#cbcbcb",
  input: "#24232a",
  inputHover: "#29272f",
  switchBackground: "rgba(255, 255, 255, 0.15)",
  switchBackgroundDot: "rgba(255, 255, 255, 0.15)",
  switchBackgroundOn: "#4bcb27",
  switchBackgroundDotOn: "rgba(255, 255, 255, 0.4)",
  criticalColor: "#ffaeae",
  criticalBorder: "#ef6262",
  infoColor: "#dcdeff",
  infoBorder: "#9aa1ff",
  warningColor: "#ffddbf",
  warningBorder: "#ffc99a",
  hovercolor: "#1B1A1A",
  gradientcolor: "#0c0c0c66",
};

export function mergeWebMain(stored?: Record<string, string> | null): Record<string, string> {
  return { ...DEFAULT_WEB_MAIN, ...(stored || {}) };
}

export function mergeAdminMain(stored?: Record<string, string> | null): Record<string, string> {
  return { ...DEFAULT_ADMIN_MAIN, ...(stored || {}) };
}
