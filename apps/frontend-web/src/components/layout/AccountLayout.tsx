import * as React from 'react';
import { cn } from '../../lib/cn';

export interface AccountLayoutProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  subHeader?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const AccountLayout: React.FC<AccountLayoutProps> = ({
  title,
  description,
  subHeader,
  children,
  className,
}) => {
  return (
    <div className={cn('max-w-5xl mx-auto py-6 px-4 space-y-4', className)}>
      {subHeader}
      {title && (
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-amber-400">{title}</h1>
          {description && <p className="text-sm text-white/60">{description}</p>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
};

export default AccountLayout;
