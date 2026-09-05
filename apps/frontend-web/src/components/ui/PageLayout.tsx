/**
 * Generic PageLayout wrapper for frontend-web pages.
 * Provides configurable main outer wrapper and centered container padding.
 */
import * as React from 'react';
import { cn } from '../../lib/cn';

export interface PageLayoutProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  variant?: string;
  mainClassName?: string;
  containerClassName?: string;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  mainClassName,
  containerClassName,
}) => {
  return (
    <div className={cn('min-h-screen text-white', mainClassName)}>
      <div className={cn('max-w-7xl mx-auto px-4 py-6', containerClassName)}>
        {children}
      </div>
    </div>
  );
};

export default PageLayout;
