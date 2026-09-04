import * as React from 'react';
import { cn } from '../../lib/cn';

export interface BannerHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  image?: string;
  className?: string;
}

export const BannerHeader: React.FC<BannerHeaderProps> = ({
  title,
  subtitle,
  className,
}) => {
  return (
    <div className={cn('p-6 rounded-2xl bg-gradient-to-r from-amber-500/20 to-purple-500/20 border border-white/10 mb-6', className)}>
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{title}</h1>
      {subtitle && <p className="text-white/70 text-sm">{subtitle}</p>}
    </div>
  );
};

export default BannerHeader;
