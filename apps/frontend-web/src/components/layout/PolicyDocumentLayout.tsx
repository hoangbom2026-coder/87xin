import * as React from 'react';
import { cn } from '../../lib/cn';

export interface PolicyDocumentLayoutProps {
  title: React.ReactNode;
  highlight?: React.ReactNode;
  subtitle?: React.ReactNode;
  description?: React.ReactNode;
  icon?: string;
  children: React.ReactNode;
  className?: string;
}

export const PolicyDocumentLayout: React.FC<PolicyDocumentLayoutProps> = ({
  title,
  highlight,
  subtitle,
  description,
  icon,
  children,
  className,
}) => {
  return (
    <div className={cn('max-w-4xl mx-auto py-8 px-4', className)}>
      <div className="text-center mb-8 border-b border-white/10 pb-6">
        {icon && <img src={icon} alt="" className="w-12 h-12 mx-auto mb-3 object-contain" />}
        <h1 className="text-3xl font-extrabold text-white mb-2">
          {title} {highlight && <span className="text-amber-400">{highlight}</span>}
        </h1>
        {(subtitle || description) && (
          <p className="text-white/60 text-sm">{subtitle || description}</p>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
};

export default PolicyDocumentLayout;
