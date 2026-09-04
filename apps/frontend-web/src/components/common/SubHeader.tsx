import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface SubHeaderProps {
  title: React.ReactNode;
  onBack?: () => void;
  rightContent?: React.ReactNode;
  className?: string;
}

export const SubHeader: React.FC<SubHeaderProps> = ({
  title,
  onBack,
  rightContent,
  className,
}) => {
  const navigate = useNavigate();
  return (
    <div className={cn('flex items-center justify-between py-3 border-b border-white/10 mb-4', className)}>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack || (() => navigate(-1))}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-bold text-lg text-white">{title}</span>
      </div>
      {rightContent && <div>{rightContent}</div>}
    </div>
  );
};

export default SubHeader;
