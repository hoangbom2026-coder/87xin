const envApiUrl = import.meta.env.VITE_API_URL as string;
const envAdminUrl = import.meta.env.VITE_ADMIN_URL as string;

export const API_BASE = envApiUrl || (typeof window !== 'undefined' && window.location.origin ? `${window.location.origin}/api` : '/api');
export const ADMIN_BASE = envAdminUrl || (typeof window !== 'undefined' && window.location.origin ? `${window.location.origin}/api` : '/api');

export const Endpoints = {
  Auth: {
    Login: '/auth/login',
    Me: '/auth/me',
  },
  Casino: {
    Launch: '/casino/launch',
    Wagers: '/casino/wagers',
  }
};
