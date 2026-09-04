/**
 * Reusable Promotion & Store template page for player frontend.
 */
import * as React from 'react';
import { useState } from 'react';
import { cn } from '../../lib/cn';

export interface PromoFilter {
  value: string;
  label: string;
}

export interface PromoCardItem {
  id: string;
  title: React.ReactNode;
  searchTitle?: string;
  description?: React.ReactNode;
  image?: string;
  imageMode?: string;
  category?: string;
  modalTitle?: string;
  storePurchase?: {
    price: number;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface PromoTemplatePageProps {
  hideIntro?: boolean;
  title?: string;
  subtitle?: string;
  filters?: PromoFilter[];
  cards?: PromoCardItem[];
  onCardClick?: (card: PromoCardItem) => void;
}

export const PromoTemplatePage: React.FC<PromoTemplatePageProps> = ({
  hideIntro,
  title,
  subtitle,
  filters = [],
  cards = [],
  onCardClick,
}) => {
  const [activeFilter, setActiveFilter] = useState(filters[0]?.value || 'all');
  const filteredCards = cards.filter(
    (c) => activeFilter === 'all' || c.category === activeFilter || !c.category
  );

  return (
    <div className="space-y-6">
      {!hideIntro && title && (
        <div className="text-center">
          <h1 className="text-3xl font-bold text-amber-400">{title}</h1>
          {subtitle && <p className="text-white/60 text-sm mt-1">{subtitle}</p>}
        </div>
      )}

      {filters.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-semibold transition-colors',
                activeFilter === f.value
                  ? 'bg-amber-400 text-black'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredCards.map((card) => (
          <div
            key={card.id}
            onClick={() => onCardClick?.(card)}
            className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl cursor-pointer transition-all hover:scale-[1.02]"
          >
            {card.image && (
              <img
                src={card.image}
                alt=""
                className="w-full h-32 object-contain mb-3 rounded-lg"
              />
            )}
            <h4 className="font-bold text-white text-base mb-1">{card.title}</h4>
            {card.description && (
              <p className="text-amber-300 font-semibold text-sm">{card.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PromoTemplatePage;
