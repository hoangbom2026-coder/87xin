import * as React from 'react'
import BannerSection from '../ui/BannerSection'
import { cn } from '../../lib/cn'

type ProgramHeroSectionProps = React.ComponentProps<typeof BannerSection> & {
  sectionClassName?: string
}

const ProgramHeroSection: React.FC<ProgramHeroSectionProps> = ({
  sectionClassName,
  className,
  ...bannerProps
}) => {
  return (
    <section className={cn('w-full', sectionClassName)}>
      <BannerSection {...bannerProps} className={cn(className)} />
    </section>
  )
}

export default ProgramHeroSection
