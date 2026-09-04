import * as React from 'react'
import { NavLink } from 'react-router-dom'
import { LIVE_CASINO_ALIASES } from '../../constants/liveCasinoMenu'
import { cn } from '../../lib/cn'

/** Nền alias — mọi breakpoint (mặc định / hover / tab đang chọn). */
const bgDefault = "bg-[url('/images/games/bg-default-alias.webp')]"
const bgInteractive =
  "hover:bg-[url('/images/games/bg-active-alias.webp')] aria-[current=page]:bg-[url('/images/games/bg-active-alias.webp')]"

const aliasLinkBase = cn(
  'group relative flex min-h-[48px] min-w-[104px] shrink-0 flex-col gap-1 overflow-hidden rounded-xl',
  'bg-[length:100%_100%] bg-center bg-no-repeat',
  bgDefault,
  bgInteractive,
  'flex-center lg:min-h-[92px] lg:min-w-0 lg:p-1',
)

/**
 * Menu alias live casino — cuộn ngang chỉ khi người dùng vuốt (overflow native), không autoplay.
 */
const LiveCasinoMenu: React.FC = () => {
  return (
    <div className="w-full min-w-0 bg-page-main pb-2 md:pb-3">
      <nav
        aria-label="Live casino"
        className="relative z-game-aliases overflow-x-hidden px-0 py-0 [-webkit-tap-highlight-color:transparent]"
      >
        <div
          className="flex flex-nowrap gap-2 overflow-x-auto overflow-y-hidden scroll-smooth no-scrollbar px-4 py-1 touch-pan-x [-webkit-overflow-scrolling:touch] md:gap-2.5"
          role="list"
        >
          {LIVE_CASINO_ALIASES.map((item) => (
            <NavLink
              key={item.key}
              role="listitem"
              to={item.to}
              end={item.end}
              className={cn(
                aliasLinkBase,
                'border-0 outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-focus)] focus-visible:ring-offset-0 focus-visible:ring-offset-transparent',
              )}
            >
              {({ isActive }) => (
                <div className="relative flex h-full min-h-[48px] w-full gap-1 px-3 flex-center lg:min-h-0 lg:px-2">
                  <div
                    className="group/image relative flex flex-center items-center justify-center overflow-hidden"
                    style={{ width: 32, height: 32 }}
                  >
                    <img
                      src={item.icon}
                      alt=""
                      width={32}
                      height={32}
                      loading="lazy"
                      decoding="async"
                      className="relative z-image size-8 object-contain lg:size-12"
                      onError={(e) => {
                        const el = e.currentTarget
                        if (el.dataset.fallback === '1') return
                        el.dataset.fallback = '1'
                        el.src = '/images/pages/live-casino/sanh-live.webp'
                      }}
                    />
                  </div>
                  <p
                    className={cn(
                      'whitespace-nowrap text-center text-xs font-semibold transition-colors duration-150 lg:w-auto lg:text-sm lg:font-medium',
                      isActive
                        ? 'text-accent-red'
                        : 'text-text-muted group-hover:text-accent-red',
                    )}
                  >
                    {item.name}
                  </p>
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

export default LiveCasinoMenu
