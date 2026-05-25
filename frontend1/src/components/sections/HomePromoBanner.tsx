import * as React from 'react'
import { cn } from '../../lib/cn'

export type HomePromoBannerProps = {
  title: React.ReactNode
  subtitle?: React.ReactNode
  image: string
  gradient: string
  accentClass?: string
  onClick?: () => void
  className?: string
}

/** Banner khuyến mãi mobile — chữ trái ~65%, ảnh góc phải dưới. */
const HomePromoBanner: React.FC<HomePromoBannerProps> = ({
  title,
  subtitle,
  image,
  gradient,
  accentClass,
  onClick,
  className,
}) => {
  const inner = (
    <>
      <div className="z-10 flex w-[65%] min-w-0 flex-col justify-center pr-2">
        <h3 className="text-3xl font-black uppercase leading-tight text-white">{title}</h3>
        {subtitle ? (
          <span className={cn('mt-0.5 text-sm font-semibold', accentClass ?? 'text-brand-textGray')}>
            {subtitle}
          </span>
        ) : null}
      </div>
      <img
        src={image}
        alt=""
        className="pointer-events-none absolute bottom-0 right-0 h-[120px] w-auto max-w-[42%] object-contain object-bottom"
        loading="lazy"
        onError={(e) => {
          if (!e.currentTarget.src.endsWith('/images/banners/home/promo_1.png')) {
            e.currentTarget.src = '/images/banners/home/promo_1.png'
          }
        }}
      />
    </>
  )

  const boxClass = cn(
    'home-promo-banner relative flex min-h-[160px] overflow-hidden rounded-2xl p-5',
    'bg-gradient-to-r',
    gradient,
    onClick && 'cursor-pointer active:scale-[0.99] transition-transform',
    className,
  )

  if (onClick) {
    return (
      <button type="button" className={cn(boxClass, 'w-full text-left')} onClick={onClick}>
        {inner}
      </button>
    )
  }

  return <div className={boxClass}>{inner}</div>
}

export default HomePromoBanner
