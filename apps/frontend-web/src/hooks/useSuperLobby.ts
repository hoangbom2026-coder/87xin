import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { launchSuperLobby } from '../services/gameService';
import { useLanguage } from '../i18n/LanguageContext';
import { toast } from '../utils/toast';

export const useSuperLobby = () => {
  const { t } = useLanguage();
  const { token } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(false);

  const handleLaunch = async (type: number = 0) => {
    if (!token) {
      toast.error(t('auth.loginRequired', 'Vui lòng đăng nhập để truy cập sảnh game'));
      return;
    }

    try {
      setLoading(true);
      // Detecting platform (WEB, MOBILE)
      const platform = window.innerWidth < 1024 ? 'MOBILE' : 'WEB';
      const res = await launchSuperLobby({ platform, type } as any);
      if (res.success && res.data?.url) {
        window.open(res.data.url, '_blank');
      } else {
        toast.error(res.message || t('game.launchFailed', 'Không thể khởi động sảnh game'));
      }
    } catch (err) {
      toast.error(t('game.launchError', 'Có lỗi xảy ra khi khởi động sảnh game'));
    } finally {
      setLoading(false);
    }
  };

  return { handleLaunch, loading };
};
