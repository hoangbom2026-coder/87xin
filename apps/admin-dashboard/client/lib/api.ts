/**
 * API client for admin-dashboard.
 * Handles JWT injection, 10s request timeout, 401 redirection, and structured error throwing.
 */
const envBase = typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_API_URL : undefined;
const API_BASE = envBase || '/api';

async function req(path: string, options: RequestInit = {}): Promise<any> {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('adminAccessToken') || localStorage.getItem('token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(`${API_BASE}${path.startsWith('/') ? path : `/${path}`}`, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });

    if (!res.ok) {
      if (res.status === 401) {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('adminAccessToken');
          localStorage.removeItem('token');
        }
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      const errorBody = await res.json().catch(() => ({}));
      const message = errorBody?.message || res.statusText || `HTTP Error ${res.status}`;
      throw new Error(message);
    }

    if (res.status === 204) {
      return null;
    }

    return await res.json().catch(() => ({}));
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function loginAdmin(username?: string, password?: string) {
  return req('/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function getMe(token?: string) {
  return req('/auth/me');
}

export async function logout(token?: string) {
  return req('/auth/logout', { method: 'POST' });
}

export async function getBusinessSettings(token?: string) {
  return req('/admin/settings');
}

export async function patchBusinessSettings(data: any) {
  return req('/admin/settings', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function getSystemInfoApi() {
  return req('/admin/system-info');
}

export async function getAdminBonuses() {
  return req('/admin/bonuses');
}

export async function createBonusApi(data: any) {
  return req('/admin/bonuses', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateBonusApi(id: string, data: any) {
  return req(`/admin/bonuses/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function deleteBonusApi(id: string) {
  return req(`/admin/bonuses/${id}`, { method: 'DELETE' });
}

export async function createRootAffiliateAdmin(data: any) {
  return req('/admin/affiliate/root', { method: 'POST', body: JSON.stringify(data) });
}

export async function getAdminAffiliateRewardLogs() {
  return req('/admin/affiliate/rewards');
}

export async function getPreference() {
  return req('/admin/preference');
}

export async function updatePreference(data: any) {
  return req('/admin/preference', { method: 'POST', body: JSON.stringify(data) });
}

export async function getAdminCurrencies() {
  return req('/admin/currencies');
}

export async function replaceUser(id: string, data: any) {
  return req(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

// VIP API
export async function getVipTiersList(token?: string) {
  return req('/vip-tiers');
}

export async function createVipTiersApi(data: any, token?: string) {
  return req('/vip-tiers', { method: 'POST', body: data instanceof FormData ? data : JSON.stringify(data) });
}

export async function updateVipTiersApi(id: string, data: any, token?: string) {
  return req(`/vip-tiers/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteVipTiersApi(id: string, token?: string) {
  return req(`/vip-tiers/${id}`, { method: 'DELETE' });
}

export async function getVipLevelsByParent(parentId: string, token?: string) {
  return req(`/vip-level/parent/${parentId}`);
}

export async function createVipLevelApi(data: any, token?: string) {
  return req('/vip-level', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateVipLevelApi(id: string, data: any, token?: string) {
  return req(`/vip-level/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteVipLevelApi(id: string, token?: string) {
  return req(`/vip-level/${id}`, { method: 'DELETE' });
}

export async function listVipSpinPrizes(token?: string) {
  return req('/vip-spin-prize');
}

export async function createVipSpinPrize(data: any, token?: string) {
  return req('/vip-spin-prize', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateVipSpinPrize(id: string, data: any, token?: string) {
  return req(`/vip-spin-prize/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteVipSpinPrize(id: string, token?: string) {
  return req(`/vip-spin-prize/${id}`, { method: 'DELETE' });
}

export async function getVipTiersConfig(token?: string) {
  return req('/vip-tiers-config');
}

export async function updateVipTiersConfig(data: any, token?: string) {
  return req('/vip-tiers-config', { method: 'POST', body: JSON.stringify(data) });
}

export async function getVipStatsApi(token?: string) {
  return req('/admin/vip/stats');
}

export async function listVipUsersApi(params?: any, token?: string) {
  return req('/admin/vip/users', { method: 'POST', body: JSON.stringify(params || {}) });
}

export type VipStats = {
  totalVipUsers?: number;
  totalVipXp?: number;
  activeTiers?: number;
  totalCashbackPaid?: number;
};

export type VipUserRow = {
  _id: string;
  username: string;
  vipLevel: number;
  vipXp: number;
  balance?: number;
  createdAt?: string;
};

export type VipTiers = {
  _id: string;
  tiersName: string;
  order: number;
};

export type VipLevel = {
  _id: string;
  parentId: string;
  levelName: string;
  xp: number;
};

export type VipTier = {
  _id?: string;
  name?: string;
  level?: number;
  minValidBet?: number;
  upReward?: number;
  cashbackRate?: number;
  lossReturnRate?: number;
  lossReturnMax?: number;
  fridayBonusRate?: number;
  fridayBonusMax?: number;
  withdrawLimit?: number;
  colorCode?: string;
};

// Fallback dynamic exports for any remaining named imports
export const api = new Proxy(
  {},
  {
    get: (_, prop: string) => (...args: any[]) => req(`/${prop}`, { method: 'POST', body: JSON.stringify(args[0] || {}) }),
  },
);

export default api;
