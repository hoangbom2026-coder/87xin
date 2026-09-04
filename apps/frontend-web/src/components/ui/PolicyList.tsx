import * as React from 'react';
import { cn } from '../../lib/cn';

export interface PolicyItem {
  title: string;
  content: string;
}

export interface PolicyListProps {
  items: PolicyItem[];
  className?: string;
}

export const PolicyList: React.FC<PolicyListProps> = ({ items, className }) => {
  return (
    <div className={cn('space-y-6', className)}>
      {items.map((item, idx) => (
        <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10">
          <h3 className="text-lg font-bold text-amber-300 mb-2">{item.title}</h3>
          <p className="text-white/80 leading-relaxed text-sm">{item.content}</p>
        </div>
      ))}
    </div>
  );
};

export default PolicyList;
