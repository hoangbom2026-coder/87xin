import * as React from 'react';
import { HelpCircle } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface QuestionMarkIconProps extends React.HTMLAttributes<HTMLDivElement> {
  onClick?: () => void;
  size?: number;
}

const QuestionMarkIcon: React.FC<QuestionMarkIconProps> = ({
  onClick,
  size = 24,
  className,
  ...rest
}) => {
  const handleKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role={onClick ? 'button' : 'presentation'}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? handleKey : undefined}
      className={cn(
        'withdraw__header-right shrink-0 flex items-center justify-center rounded-full bg-slate-100/10 text-slate-100 transition-all',
        onClick && 'cursor-pointer hover:bg-slate-100/20 hover:scale-105 active:scale-95',
        className,
      )}
      style={{ width: size, height: size }}
      {...rest}
    >
      <HelpCircle size={size * 0.75} strokeWidth={2.5} />
    </div>
  );
};

export default QuestionMarkIcon;
