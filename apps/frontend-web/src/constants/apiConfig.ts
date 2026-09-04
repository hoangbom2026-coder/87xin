export const API_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8701/api';
export const ADMIN_BASE = (import.meta.env.VITE_ADMIN_URL as string) || 'http://localhost:8702/api';

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
