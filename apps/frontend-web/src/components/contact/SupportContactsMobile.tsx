/**
 * Contact channels widget for mobile and desktop views.
 */
import * as React from 'react';
import { Mail, Send } from 'lucide-react';
import { SUPPORT_EMAIL, TELEGRAM_SUPPORT_URL } from '../../constants/siteUrls';

export const SupportContactsMobile: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
      <a
        href={`mailto:${SUPPORT_EMAIL}`}
        className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
      >
        <Mail className="w-5 h-5 text-amber-400" />
        <div>
          <span className="text-xs text-white/50 block">Email hỗ trợ</span>
          <span className="text-sm font-semibold text-white">{SUPPORT_EMAIL}</span>
        </div>
      </a>
      <a
        href={TELEGRAM_SUPPORT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
      >
        <Send className="w-5 h-5 text-blue-400" />
        <div>
          <span className="text-xs text-white/50 block">Telegram 24/7</span>
          <span className="text-sm font-semibold text-white">@tcgaming_support</span>
        </div>
      </a>
    </div>
  );
};

export default SupportContactsMobile;
