import * as React from 'react';
import { cn } from '../../lib/cn';

export interface ContentSectionProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headingClassName?: string;
  glow?: boolean;
  accent?: boolean;
}

export const ContentSection: React.FC<ContentSectionProps> = ({
  title,
  subtitle,
  children,
  className,
  glow,
  accent,
}) => {
  return (
    <section className={cn(
      'py-6',
      glow && 'relative overflow-hidden',
      accent && 'border border-amber-400/20 bg-amber-400/5 rounded-xl',
      className,
    )}>
      {glow && (
        <div className="absolute inset-0 bg-gradient-to-r from-amber-400/10 via-transparent to-amber-400/10 pointer-events-none" />
      )}
      {title && <h2 className="text-2xl font-bold mb-2 text-amber-400 relative z-10">{title}</h2>}
      {subtitle && <p className="text-white/60 mb-4 text-sm relative z-10">{subtitle}</p>}
      <div className="relative z-10">{children}</div>
    </section>
  );
};

export default ContentSection;
