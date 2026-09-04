import * as React from 'react';

export const PromoDetailModal: React.FC<{ isOpen?: boolean; onClose?: () => void; promo?: any }> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-[#1a222d] border border-white/10 rounded-2xl p-6 max-w-lg w-full">
        <h3 className="text-xl font-bold text-amber-400 mb-4">Chi tiết khuyến mãi</h3>
        <button onClick={onClose} className="px-4 py-2 bg-white/10 rounded-lg text-white">Đóng</button>
      </div>
    </div>
  );
};
