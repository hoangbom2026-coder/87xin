import * as React from 'react';
import { cn } from '../../lib/cn';

export interface ContentSectionProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const ContentSection: React.FC<ContentSectionProps> = ({
  title,
  subtitle,
  children,
  className,
}) => {
  return (
    <section className={cn('py-6', className)}>
      {title && <h2 className="text-2xl font-bold mb-2 text-amber-400">{title}</h2>}
      {subtitle && <p className="text-white/60 mb-4 text-sm">{subtitle}</p>}
      <div>{children}</div>
    </section>
  );
};

export default ContentSection;
