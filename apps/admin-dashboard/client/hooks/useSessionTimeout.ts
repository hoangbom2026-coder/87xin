import { useEffect, useRef } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { toast } from '@game/ui/use-toast';

/** Chuẩn vận hành ca dài: 30 phút không tương tác → đăng xuất. */
const SESSION_TIMEOUT = 30 * 60 * 1000;
const CHECK_INTERVAL = 60 * 1000; // Check every minute

export function useSessionTimeout() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const lastActivityRef = useRef<number>(Date.now());
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  // Update last activity time on user interaction
  const updateActivity = () => {
    lastActivityRef.current = Date.now();
  };

  useEffect(() => {
    if (!token) return;

    // Track user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      window.addEventListener(event, updateActivity);
    });

    // Check session timeout periodically
    const checkTimeout = () => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivityRef.current;

      if (timeSinceActivity >= SESSION_TIMEOUT) {
        // Session expired
        logout();
        toast({
          title: "Phiên hết hạn",
          description: "Không hoạt động 30 phút — vui lòng đăng nhập lại.",
          variant: "destructive",
        });
        navigate('/login', { replace: true });
      }
    };

    // Start checking
    timeoutIdRef.current = setInterval(checkTimeout, CHECK_INTERVAL);

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
      if (timeoutIdRef.current) {
        clearInterval(timeoutIdRef.current);
      }
    };
  }, [token, logout, navigate]);
}
