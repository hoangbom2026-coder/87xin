/**
 * Đồng bộ với `:root` trong `index.css` (--banner-page-h-sm / --banner-page-h-md / …).
 * Dùng cho copy UI, gợi ý admin, hoặc assert layout test.
 */
export const BANNER_CSS_VARS = {
  pageHeightSm: '--banner-page-h-sm',
  pageHeightMd: '--banner-page-h-md',
  sidebarMinH: '--banner-sidebar-min-h',
  sidebarMaxH: '--banner-sidebar-max-h',
} as const

/** Giá trị px tương ứng biến CSS (single source cho doc / admin copy) */
export const BANNER_LAYOUT_PX = {
  pageHeightMobile: 220,
  pageHeightDesktop: 291,
  sidebarMinHeight: 280,
  sidebarMaxHeight: 420,
} as const

/** Gợi ý upload — FE luôn crop `object-cover` theo khung cố định */
export const BANNER_UPLOAD_HINT_VI =
  `Ảnh banner trang: khung cố định cao ${BANNER_LAYOUT_PX.pageHeightMobile}px (mobile) / ${BANNER_LAYOUT_PX.pageHeightDesktop}px (desktop), rộng theo container. Nên dùng file ngang ~1920×640 px (tỉ lệ ~3:1) trở lên.`
