import * as React from 'react'
import { BannerHeader, BannerHeaderProps } from './BannerHeader'

export type BannerSectionProps = BannerHeaderProps

export const BannerSection: React.FC<BannerSectionProps> = (props) => {
  return <BannerHeader {...props} />
}

export default BannerSection
