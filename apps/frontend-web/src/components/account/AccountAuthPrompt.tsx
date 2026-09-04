import * as React from 'react';
import { openAuthModal } from '../../utils/openAuthModal';

export const AccountAuthPrompt: React.FC = () => {
  return (
    <div className="text-center py-12 p-6 rounded-2xl bg-white/5 border border-white/10 max-w-md mx-auto">
      <h3 className="text-xl font-bold text-amber-400 mb-2">Yêu cầu đăng nhập</h3>
      <p className="text-white/60 text-sm mb-6">
        Vui lòng đăng nhập để truy cập thông tin tài khoản và giao dịch.
      </p>
      <button
        type="button"
        onClick={() => openAuthModal('login')}
        className="px-6 py-2.5 bg-amber-400 text-black font-bold rounded-xl hover:bg-amber-300 transition-colors"
      >
        Đăng nhập ngay
      </button>
    </div>
  );
};

export default AccountAuthPrompt;
