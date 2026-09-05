/**
 * Standard FormField component for form layouts in frontend-web.
 */
import * as React from 'react';
import { cn } from '../../lib/cn';

export interface FormFieldProps {
  label?: React.ReactNode;
  error?: string | null;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  children,
  className,
}) => {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && <label className="block text-sm font-semibold text-white/80">{label}</label>}
      <div>{children}</div>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
};

export default FormField;
