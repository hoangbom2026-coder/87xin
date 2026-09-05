/**
 * API client for admin-dashboard.
 * Handles JWT injection, 10s request timeout, 401 redirection, and structured error throwing.
 */
const envBase = typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_API_URL : undefined;
const API_BASE = envBase || '/api';

async function req(path: string, options: RequestInit = {}): Promise<any> {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('adminAccessToken') || localStorage.getItem('token') : null;
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
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

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function loginAdmin(username?: string, password?: string) {
  return req('/auth/admin/login', { method: 'POST', body: JSON.stringify({ username, password }) });
}

export async function getMe(token?: string) {
  return req('/auth/me');
}

export async function logout(token?: string) {
  return req('/auth/logout', { method: 'POST' });
}

// ─── Settings / Business ─────────────────────────────────────────────────────

export async function getBusinessSettings(token?: string) {
  return req('/admin/settings');
}

export async function patchBusinessSettings(data: any, token?: string) {
  return req('/admin/settings', { method: 'PATCH', body: JSON.stringify(data) });
}

export async function getSystemInfoApi(token?: string) {
  return req('/admin/system-info');
}

export async function uploadSettingBannerAsset(fileOrToken: File | string, fileOrUndef?: File | string, token?: string) {
  const file = fileOrToken instanceof File ? fileOrToken : (fileOrUndef instanceof File ? fileOrUndef : null);
  if (!file) return {};
  const fd = new FormData();
  fd.append('file', file);
  return req('/admin/settings/upload-banner', { method: 'POST', body: fd });
}

export async function uploadGameIconAsset(file: File, token?: string) {
  const fd = new FormData();
  fd.append('file', file);
  return req('/admin/game-icons/upload', { method: 'POST', body: fd });
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export async function getAdminDashboard(params?: any, extra?: any, token?: string) {
  return req('/admin/dashboard');
}

// ─── Bonuses ─────────────────────────────────────────────────────────────────

export async function getAdminBonuses(token?: string) {
  return req('/admin/bonuses');
}

export async function createBonusApi(data: any, token?: string) {
  return req('/admin/bonuses', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateBonusApi(id: string, data: any, token?: string) {
  return req(`/admin/bonuses/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function deleteBonusApi(id: string, token?: string) {
  return req(`/admin/bonuses/${id}`, { method: 'DELETE' });
}

// ─── Currencies ──────────────────────────────────────────────────────────────

export async function getAdminCurrencies(token?: string) {
  return req('/admin/currencies');
}

export async function createCurrencyApi(data: any, token?: string) {
  return req('/admin/currencies', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateCurrencyApi(id: string, data: any, token?: string) {
  return req(`/admin/currencies/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function deleteCurrencyApi(id: string, token?: string) {
  return req(`/admin/currencies/${id}`, { method: 'DELETE' });
}

export async function getRates(token?: string) {
  return req('/admin/currencies/rates');
}

export async function updateRates(data: any, token?: string) {
  return req('/admin/currencies/rates', { method: 'POST', body: JSON.stringify(data) });
}

export async function syncRates(token?: string) {
  return req('/admin/currencies/rates/sync', { method: 'POST' });
}

// NowPay currencies
export async function listNowpayCurrencies(params?: any, token?: string) {
  return req('/admin/nowpay/currencies');
}

export async function loadNowpayCurrencies(token?: string) {
  return req('/admin/nowpay/currencies/load', { method: 'POST' });
}

export async function updateNowpayCurrencyStatus(id: string, data: any, token?: string) {
  return req(`/admin/nowpay/currencies/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

// ─── Preference ──────────────────────────────────────────────────────────────

export async function getPreference(token?: string) {
  return req('/admin/preference');
}

export async function updatePreference(data: any, token?: string) {
  return req('/admin/preference', { method: 'POST', body: JSON.stringify(data) });
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function getUsers(params?: any, token?: string) {
  return req('/admin/users', { method: 'POST', body: JSON.stringify(params || {}) });
}

export async function replaceUser(id: string, data: any, token?: string) {
  return req(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function setUserPassword(id: string, data: any, token?: string) {
  return req(`/admin/users/${id}/set-password`, { method: 'POST', body: JSON.stringify(data) });
}

// ─── Staff (Admins) ───────────────────────────────────────────────────────────

export async function listStaffApi(params?: any, token?: string) {
  return req('/admin/staff', { method: 'POST', body: JSON.stringify(params || {}) });
}

export async function createStaffApi(data: any, token?: string) {
  return req('/admin/staff', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateStaffApi(id: string, data: any, token?: string) {
  return req(`/admin/staff/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function deleteStaffApi(id: string, token?: string) {
  return req(`/admin/staff/${id}`, { method: 'DELETE' });
}

export async function resetStaffPasswordApi(id: string, data: any, token?: string) {
  return req(`/admin/staff/${id}/reset-password`, { method: 'POST', body: JSON.stringify(data) });
}

// ─── Roles ───────────────────────────────────────────────────────────────────

export async function getRolesApi(token?: string) {
  return req('/admin/roles');
}

export async function createRoleApi(data: any, token?: string) {
  return req('/admin/roles', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateRoleApi(id: string, data: any, token?: string) {
  return req(`/admin/roles/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function deleteRoleApi(id: string, token?: string) {
  return req(`/admin/roles/${id}`, { method: 'DELETE' });
}

export async function getPermissionCatalogApi(token?: string) {
  return req('/admin/roles/permissions/catalog');
}

// ─── IP Management ────────────────────────────────────────────────────────────

export async function listIPAccessAdminApi(params?: any, token?: string) {
  return req('/admin/ip', { method: 'POST', body: JSON.stringify(params || {}) });
}

export async function createIPAccessAdminApi(data: any, token?: string) {
  return req('/admin/ip', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateIPAccessAdminApi(id: string, data: any, token?: string) {
  return req(`/admin/ip/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function deleteIPAccessAdminApi(id: string, token?: string) {
  return req(`/admin/ip/${id}`, { method: 'DELETE' });
}

// ─── Affiliate ───────────────────────────────────────────────────────────────

export async function createRootAffiliateAdmin(data: any, token?: string) {
  return req('/admin/affiliate/root', { method: 'POST', body: JSON.stringify(data) });
}

export async function getAdminAffiliateRewardLogs(params?: any, token?: any) {
  const alp = typeof params === 'string' ? {} : (params || {});
  return req('/admin/affiliate/rewards', { method: 'POST', body: JSON.stringify(alp) });
}

export async function getAffiliateExtrasApi(token?: string) {
  return req('/admin/affiliate/extras');
}

export async function patchAffiliateExtrasApi(data: any, token?: string) {
  return req('/admin/affiliate/extras', { method: 'PATCH', body: JSON.stringify(data) });
}

export async function getAffiliateCounterApi(token?: string) {
  return req('/admin/affiliate/counter');
}

export async function getAffiliateSignupsApi(params?: any, token?: string) {
  return req('/admin/affiliate/signups', { method: 'POST', body: JSON.stringify(params || {}) });
}

export async function getAffiliateCommissionSplitApi(token?: string) {
  return req('/admin/affiliate/commission-split');
}

export async function listAffiliateFeedApi(params?: any, token?: string) {
  return req('/admin/affiliate/feed', { method: 'POST', body: JSON.stringify(params || {}) });
}

export async function createAffiliateFeedApi(data: any, token?: string) {
  return req('/admin/affiliate/feed', { method: 'POST', body: JSON.stringify(data) });
}

export async function patchAffiliateFeedApi(id: string, data: any, token?: string) {
  return req(`/admin/affiliate/feed/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function deleteAffiliateFeedApi(id: string, token?: string) {
  return req(`/admin/affiliate/feed/${id}`, { method: 'DELETE' });
}

export async function generateAffiliateFeedNowApi(token?: string) {
  return req('/admin/affiliate/feed/generate', { method: 'POST' });
}

export async function purgeAffiliateAutoFeedApi(token?: string) {
  return req('/admin/affiliate/feed/purge', { method: 'POST' });
}

export async function runAffiliateAutoPayout(token?: string) {
  return req('/admin/affiliate/payout/run', { method: 'POST' });
}

export async function getAffiliateMechanism(token?: string) {
  return req('/admin/affiliate/mechanism');
}

export async function updateAffiliateMechanism(dataOrToken: any, dataOrUndef?: any, token?: string) {
  const amData = typeof dataOrToken === 'string' ? dataOrUndef : dataOrToken;
  return req('/admin/affiliate/mechanism', { method: 'POST', body: JSON.stringify(amData || {}) });
}

export async function listAffiliateExtrasUsersApi(params?: any, token?: string) {
  return req('/admin/affiliate/extras/users', { method: 'POST', body: JSON.stringify(params || {}) });
}

// ─── Agents ───────────────────────────────────────────────────────────────────

export async function getAgentProgramApi(token?: string) {
  return req('/admin/agents/program');
}

export async function patchAgentProgramApi(data: any, token?: string) {
  return req('/admin/agents/program', { method: 'PATCH', body: JSON.stringify(data) });
}

export async function getAgentStatsApi(token?: string) {
  return req('/admin/agents/stats');
}

export async function getAgentTreeApi(idOrParams?: any, levelOrToken?: any, token?: string) {
  const p = typeof idOrParams === 'string' ? { id: idOrParams, level: levelOrToken } : (idOrParams || {});
  return req('/admin/agents/tree', { method: 'POST', body: JSON.stringify(p) });
}

export async function listAgentsApi(params?: any, token?: any) {
  return req('/admin/agents/list', { method: 'POST', body: JSON.stringify(params || {}) });
}

export async function listAgentCommissionsApi(params?: any, token?: string) {
  return req('/admin/agents/commissions', { method: 'POST', body: JSON.stringify(params || {}) });
}

export async function postAgentManualAdjustmentApi(idOrData: any, dataOrToken?: any, token?: string) {
  const d = typeof idOrData === 'string' ? { id: idOrData, ...dataOrToken } : idOrData;
  return req('/admin/agents/adjustment', { method: 'POST', body: JSON.stringify(d) });
}

export async function postAgentRetryInterestCronApi(token?: string) {
  return req('/admin/agents/retry-interest', { method: 'POST' });
}

export async function setAgentStatusApi(id: string, data: any, token?: string) {
  return req(`/admin/agents/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) });
}

// ─── Audit ────────────────────────────────────────────────────────────────────

export async function getAdminAuditLogs(params?: any, token?: any) {
  const p = typeof params === 'string' ? {} : (params || {});
  return req('/admin/audit', { method: 'POST', body: JSON.stringify(p) });
}

// ─── Churn ────────────────────────────────────────────────────────────────────

export async function getChurnAtRisk(params?: any, token?: any) {
  const cp = typeof params === 'string' ? {} : (params || {});
  return req('/admin/churn', { method: 'POST', body: JSON.stringify(cp) });
}

export async function postChurnOffer(data?: any, token?: any) {
  const coData = typeof data === 'string' ? {} : (data || {});
  return req('/admin/churn/offer', { method: 'POST', body: JSON.stringify(coData) });
}

// ─── KYC ─────────────────────────────────────────────────────────────────────

export async function listKycs(params?: any, token?: string) {
  return req('/admin/kyc', { method: 'POST', body: JSON.stringify(params || {}) });
}

export async function getKycItem(id: string, token?: string) {
  return req(`/admin/kyc/${id}`);
}

export async function updateKycApi(id: string, data: any, token?: string) {
  return req(`/admin/kyc/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export async function listTransactions(params?: any, token?: any) {
  const tp = typeof params === 'string' ? {} : (params || {});
  return req('/admin/transactions', { method: 'POST', body: JSON.stringify(tp) });
}

export async function listBetTransactions(params?: any, token?: string) {
  return req('/admin/transactions/bets', { method: 'POST', body: JSON.stringify(params || {}) });
}

export async function getAdminInvestLogs(params?: any, token?: any) {
  const ilp = typeof params === 'string' ? {} : (params || {});
  return req('/admin/invest-logs', { method: 'POST', body: JSON.stringify(ilp) });
}

// ─── Deposits ─────────────────────────────────────────────────────────────────

export async function listDeposits(params?: any, token?: string) {
  return req('/admin/deposits', { method: 'POST', body: JSON.stringify(params || {}) });
}

export async function getDepositItem(id: any, token?: string) {
  const depId = typeof id === 'object' ? (id?.orderId || id?._id || id?.depositId || '') : id;
  return req(`/admin/deposits/${depId}`);
}

export async function approveVnDomesticDeposit(id: any, data?: any, token?: string) {
  const aId = typeof id === 'object' ? (id?.depositId || id?._id || '') : id;
  const aData = typeof id === 'object' ? id : (data || {});
  return req(`/admin/deposits/${aId}/approve`, { method: 'POST', body: JSON.stringify(aData) });
}

export async function rejectVnDomesticDeposit(id: any, data?: any, token?: string) {
  const rId = typeof id === 'object' ? (id?.depositId || id?._id || '') : id;
  const rData = typeof id === 'object' ? id : (data || {});
  return req(`/admin/deposits/${rId}/reject`, { method: 'POST', body: JSON.stringify(rData) });
}

// ─── Withdrawals ──────────────────────────────────────────────────────────────

export async function listWithdrawals(params?: any, token?: string) {
  return req('/admin/withdrawals', { method: 'POST', body: JSON.stringify(params || {}) });
}

export async function getWithdrawalItem(id: any, token?: string) {
  const wId = typeof id === 'object' ? (id?.orderId || id?._id || '') : id;
  return req(`/admin/withdrawals/${wId}`);
}

export async function getPendingWithdrawals(token?: string) {
  return req('/admin/withdrawals/pending');
}

export async function approveWithdrawal(id: string, data?: any, token?: string) {
  return req(`/admin/withdrawals/${id}/approve`, { method: 'POST', body: JSON.stringify(data || {}) });
}

export async function declineWithdrawal(id: string, data?: any, token?: string) {
  return req(`/admin/withdrawals/${id}/decline`, { method: 'POST', body: JSON.stringify(data || {}) });
}

export async function createAdminWithdraw(data: any, token?: string) {
  return req('/admin/withdrawals/create', { method: 'POST', body: JSON.stringify(data) });
}

// ─── Banners ─────────────────────────────────────────────────────────────────

export async function getAdminBanners(token?: string) {
  return req('/admin/banners');
}

export async function createBannerApi(data: any, token?: string) {
  return req('/admin/banners', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateBannerApi(id: string, data: any, token?: string) {
  return req(`/admin/banners/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function deleteBannerApi(id: string, token?: string) {
  return req(`/admin/banners/${id}`, { method: 'DELETE' });
}

// ─── Articles ─────────────────────────────────────────────────────────────────

export async function listArticlePosts(token?: string, params?: any) {
  return req('/admin/articles', { method: 'POST', body: JSON.stringify(params || {}) });
}

export async function getArticlePost(id: string, token?: string) {
  return req(`/admin/articles/${id}`);
}

export async function patchArticlePost(id: string, data: any, token?: string) {
  return req(`/admin/articles/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function deleteArticlePost(id: string, token?: string) {
  return req(`/admin/articles/${id}`, { method: 'DELETE' });
}

export async function createArticlePost(data: any, token?: string) {
  return req('/admin/articles/create', { method: 'POST', body: JSON.stringify(data) });
}

export async function listArticleCategories(token?: string) {
  return req('/admin/article-categories');
}

export async function createArticleCategory(data: any, token?: string) {
  return req('/admin/article-categories', { method: 'POST', body: JSON.stringify(data) });
}

export async function patchArticleCategory(id: string, data: any, token?: string) {
  return req(`/admin/article-categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function deleteArticleCategory(id: string, token?: string) {
  return req(`/admin/article-categories/${id}`, { method: 'DELETE' });
}

// ─── Content Blocks ────────────────────────────────────────────────────────────

export async function getContentBlocks(token?: string) {
  return req('/admin/content-blocks');
}

export async function createContentBlock(data: any, token?: string) {
  return req('/admin/content-blocks', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateContentBlock(id: string, data: any, token?: string) {
  return req(`/admin/content-blocks/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function deleteContentBlock(id: string, token?: string) {
  return req(`/admin/content-blocks/${id}`, { method: 'DELETE' });
}

// ─── Help Center ──────────────────────────────────────────────────────────────

export async function getHelpList(params?: any, token?: string) {
  return req('/admin/help', { method: 'POST', body: JSON.stringify(params || {}) });
}

export async function createHelpApi(data: any, token?: string) {
  return req('/admin/help', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateHelpApi(id: string, data: any, token?: string) {
  return req(`/admin/help/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function deleteHelpBySlug(slug: string, token?: string) {
  return req(`/admin/help/${slug}`, { method: 'DELETE' });
}

// ─── Tickets ─────────────────────────────────────────────────────────────────

export async function getAdminTickets(params?: any, token?: string) {
  return req('/admin/tickets', { method: 'POST', body: JSON.stringify(params || {}) });
}

export async function getTicketDetail(id: string, token?: string) {
  return req(`/admin/tickets/${id}`);
}

export async function replyTicketApi(id: string, data: any, token?: string) {
  return req(`/admin/tickets/${id}/reply`, { method: 'POST', body: JSON.stringify(data) });
}

export async function closeTicketApi(id: string, token?: string) {
  return req(`/admin/tickets/${id}/close`, { method: 'POST' });
}

// ─── Support Chat ─────────────────────────────────────────────────────────────

export async function getSupportStats(token?: string) {
  return req('/admin/support/stats');
}

export async function listSupportConversations(params?: any, token?: string) {
  return req('/admin/support/conversations', { method: 'POST', body: JSON.stringify(params || {}) });
}

export async function listSupportMessages(conversationId: string, params?: any, token?: string) {
  return req(`/admin/support/conversations/${conversationId}/messages`);
}

export async function postSupportMessage(conversationId: string, data: any, token?: string) {
  return req(`/admin/support/conversations/${conversationId}/messages`, { method: 'POST', body: JSON.stringify(data) });
}

export async function markSupportRead(conversationId: string, token?: string) {
  return req(`/admin/support/conversations/${conversationId}/read`, { method: 'POST' });
}

export async function setSupportStatus(conversationId: string, data: any, token?: string) {
  return req(`/admin/support/conversations/${conversationId}/status`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function assignSupport(conversationId: string, data: any, token?: string) {
  return req(`/admin/support/conversations/${conversationId}/assign`, { method: 'POST', body: JSON.stringify(data) });
}

export async function updateSupportMeta(conversationId: string, data: any, token?: string) {
  return req(`/admin/support/conversations/${conversationId}/meta`, { method: 'PATCH', body: JSON.stringify(data) });
}

// ─── Media Library ────────────────────────────────────────────────────────────

export async function listMediaFoldersApi(params?: any, token?: string) {
  return req('/admin/media/folders', { method: 'POST', body: JSON.stringify(params || {}) });
}

export async function createMediaFolderApi(data: any, token?: string) {
  return req('/admin/media/folders', { method: 'POST', body: JSON.stringify(data) });
}

export async function deleteMediaFolderApi(id: string, token?: string) {
  return req(`/admin/media/folders/${id}`, { method: 'DELETE' });
}

export async function listMediaApi(params?: any, token?: string) {
  return req('/admin/media', { method: 'POST', body: JSON.stringify(params || {}) });
}

export async function uploadMediaApi(
  fileOrToken: File | File[] | string,
  folderOrFile?: string | File,
  tokenOrFolder?: string,
  onProgress?: ((loaded: number, total: number) => void) | string,
) {
  const file = (Array.isArray(fileOrToken) ? fileOrToken[0] : null) || (fileOrToken instanceof File ? fileOrToken : null) || (folderOrFile instanceof File ? folderOrFile : null);
  const folderId = fileOrToken instanceof File ? (typeof folderOrFile === 'string' ? folderOrFile : undefined) : (typeof folderOrFile === 'string' ? folderOrFile : undefined);
  if (!file) return {};
  const fd = new FormData();
  fd.append('file', file);
  if (folderId) fd.append('folderId', folderId);
  return req('/admin/media/upload', { method: 'POST', body: fd });
}

export async function patchMediaApi(id: string, data: any, token?: string) {
  return req(`/admin/media/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function deleteMediaApi(id: string, token?: string) {
  return req(`/admin/media/${id}`, { method: 'DELETE' });
}

export async function bulkDeleteMediaApi(ids: string[], token?: string) {
  return req('/admin/media/bulk-delete', { method: 'POST', body: JSON.stringify({ ids }) });
}

export async function moveMediaApi(id: string, folderId: string, token?: string) {
  return req(`/admin/media/${id}/move`, { method: 'POST', body: JSON.stringify({ folderId }) });
}

// ─── Newsletter ───────────────────────────────────────────────────────────────

export async function listNewsletterApi(params?: any, token?: string) {
  return req('/admin/newsletter', { method: 'POST', body: JSON.stringify(params || {}) });
}

export async function patchNewsletterApi(id: string, data: any, token?: string) {
  return req(`/admin/newsletter/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function deleteNewsletterApi(id: string, token?: string) {
  return req(`/admin/newsletter/${id}`, { method: 'DELETE' });
}

export function newsletterCsvUrl(status?: string) {
  const q = status ? `?status=${encodeURIComponent(status)}` : '';
  return `${API_BASE}/admin/newsletter/export-csv${q}`;
}

// ─── Games ────────────────────────────────────────────────────────────────────

export async function getGameCatalogApi(params?: any, token?: string) {
  return req('/admin/games', { method: 'POST', body: JSON.stringify(params || {}) });
}

export async function listGamesApi(params?: any, token?: string) {
  return req('/admin/games/list', { method: 'POST', body: JSON.stringify(params || {}) });
}

export async function getGameCountsApi(token?: string) {
  return req('/admin/games/counts');
}

export async function createGameApi(data: any, token?: string) {
  return req('/admin/games', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateGameApi(id: string, data: any, token?: string) {
  return req(`/admin/games/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function deleteGameApi(id: string, token?: string) {
  return req(`/admin/games/${id}`, { method: 'DELETE' });
}

export async function bulkPatchGameFlagsApi(ids: any, flags?: any, token?: string) {
  const bgData = flags !== undefined ? { ids, flags } : ids;
  return req('/admin/games/bulk-flags', { method: 'POST', body: JSON.stringify(bgData) });
}

// ─── Game Menu ────────────────────────────────────────────────────────────────

export async function getGameMenuConfig(data?: any, token?: string) {
  return req('/admin/game-menu');
}

export async function updateGameMenuConfig(data: any, token?: any) {
  const gmData = typeof data === 'string' ? {} : (data || {});
  return req('/admin/game-menu', { method: 'POST', body: JSON.stringify(gmData) });
}

// ─── Daily Challenges ─────────────────────────────────────────────────────────

export async function listDailyChallengesApi(params?: any, token?: string) {
  return req('/admin/daily-challenges', { method: 'POST', body: JSON.stringify(params || {}) });
}

export async function createDailyChallengeApi(data: any, token?: string) {
  return req('/admin/daily-challenges', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateDailyChallengeApi(id: string, data: any, token?: string) {
  return req(`/admin/daily-challenges/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function deleteDailyChallengeApi(id: string, token?: string) {
  return req(`/admin/daily-challenges/${id}`, { method: 'DELETE' });
}

// ─── Packages & Plans ─────────────────────────────────────────────────────────

export async function getPackages(params?: any, token?: string) {
  return req('/admin/packages', { method: 'POST', body: JSON.stringify(params || {}) });
}

export async function createPackage(data: any, token?: string) {
  return req('/admin/packages', { method: 'POST', body: JSON.stringify(data) });
}

export async function updatePackage(id: string, data: any, token?: string) {
  return req(`/admin/packages/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function deletePackage(id: string, token?: string) {
  return req(`/admin/packages/${id}`, { method: 'DELETE' });
}

export async function getPackageCategories(token?: string) {
  return req('/admin/package-categories');
}

export async function createPackageCategory(data: any, token?: string) {
  return req('/admin/package-categories', { method: 'POST', body: JSON.stringify(data) });
}

export async function getPlans(paramsOrToken?: any, extra?: any, token?: string) {
  const p = typeof paramsOrToken === 'string' ? extra : paramsOrToken;
  return req('/admin/plans');
}

export async function getPlan(id: string, token?: string) {
  return req(`/admin/plans/${id}`);
}

export async function createPlan(data: any, token?: string) {
  return req('/admin/plans', { method: 'POST', body: JSON.stringify(data) });
}

export async function updatePlan(id: string, data: any, token?: string) {
  return req(`/admin/plans/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function deletePlan(id: string, token?: string) {
  return req(`/admin/plans/${id}`, { method: 'DELETE' });
}

export async function duplicatePlan(id: string, token?: string) {
  return req(`/admin/plans/${id}/duplicate`, { method: 'POST' });
}

export async function patchPlanStatus(id: string, data: any, token?: string) {
  return req(`/admin/plans/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) });
}

// ─── Store ────────────────────────────────────────────────────────────────────

export async function getStoreStatsApi(token?: string) {
  return req('/admin/store/stats');
}

export async function listStorePackagesApi(params?: any, token?: string) {
  return req('/admin/store/packages', { method: 'POST', body: JSON.stringify(params || {}) });
}

export async function createStorePackageApi(data: any, token?: string) {
  return req('/admin/store/packages', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateStorePackageApi(id: string, data: any, token?: string) {
  return req(`/admin/store/packages/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function deleteStorePackageApi(id: string, token?: string) {
  return req(`/admin/store/packages/${id}`, { method: 'DELETE' });
}

export async function listStoreOrdersApi(params?: any, token?: string) {
  return req('/admin/store/orders', { method: 'POST', body: JSON.stringify(params || {}) });
}

// ─── Rewards ─────────────────────────────────────────────────────────────────

export async function getRewardStatus(token?: string) {
  return req('/admin/rewards/status');
}

export async function getRewardDashboard(token?: string) {
  return req('/admin/rewards/dashboard');
}

export async function getRewardActivity(token?: string) {
  return req('/admin/rewards/activity');
}

export async function getRewardLog(params?: any, token?: string) {
  return req('/admin/rewards/log', { method: 'POST', body: JSON.stringify(params || {}) });
}

export async function convertReward(data: any, token?: string) {
  return req('/admin/rewards/convert', { method: 'POST', body: JSON.stringify(data) });
}

// ─── Referrals ────────────────────────────────────────────────────────────────

export async function getReferralCodes(token?: string) {
  return req('/admin/referral-codes');
}

export async function createReferralCodeApi(data: any, token?: string) {
  return req('/admin/referral-codes', { method: 'POST', body: JSON.stringify(data) });
}

export async function patchReferralCommissionApi(id: string, data: any, token?: string) {
  return req(`/admin/referral-codes/${id}/commission`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function getReferralStatus(token?: string) {
  return req('/admin/referral-codes/status');
}

// ─── Plugins ─────────────────────────────────────────────────────────────────

export async function listSitePlugins(params?: any, token?: string) {
  return req('/admin/plugins', { method: 'POST', body: JSON.stringify(params || {}) });
}

export async function createSitePlugin(data: any, token?: string) {
  return req('/admin/plugins', { method: 'POST', body: JSON.stringify(data) });
}

export async function patchSitePlugin(id: string, data: any, token?: string) {
  return req(`/admin/plugins/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function installSitePlugin(id: string, token?: string) {
  return req(`/admin/plugins/${id}/install`, { method: 'POST' });
}

export async function uninstallSitePlugin(id: string, token?: string) {
  return req(`/admin/plugins/${id}/uninstall`, { method: 'POST' });
}

// ─── Telegram ─────────────────────────────────────────────────────────────────

export async function getTelegramTemplates(token?: string) {
  return req('/admin/telegram/templates');
}

export async function sendTelegramTest(data: any, token?: string) {
  return req('/admin/telegram/test', { method: 'POST', body: JSON.stringify(data) });
}

// ─── Email ────────────────────────────────────────────────────────────────────

export async function getEmailSettingsApi(token?: string) {
  return req('/admin/email/settings');
}

export async function patchEmailSettingsApi(data: any, token?: string) {
  return req('/admin/email/settings', { method: 'PATCH', body: JSON.stringify(data) });
}

export async function sendEmailTestApi(data: any, token?: string) {
  return req('/admin/email/test', { method: 'POST', body: JSON.stringify(data) });
}

// ─── Realtime ─────────────────────────────────────────────────────────────────

export async function getRealtimeEventsAdminApi(params?: any, token?: string) {
  return req('/admin/realtime/events', { method: 'POST', body: JSON.stringify(params || {}) });
}

// ─── Bot Automation ───────────────────────────────────────────────────────────

export async function getBotAutomation(token?: string) {
  return req('/admin/bot-automation');
}

export async function patchBotAutomation(data: any, token?: string) {
  return req('/admin/bot-automation', { method: 'PATCH', body: JSON.stringify(data) });
}

// ─── VIP ─────────────────────────────────────────────────────────────────────

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
  return req('/admin/vip/tiers');
}

export async function updateVipTiersConfig(data: any, token?: string) {
  return req('/admin/vip/tiers', { method: 'POST', body: JSON.stringify(data) });
}

export async function getVipStatsApi(token?: string) {
  return req('/admin/vip/stats');
}

export async function listVipUsersApi(params?: any, token?: string) {
  return req('/admin/vip/users', { method: 'POST', body: JSON.stringify(params || {}) });
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type SystemInfo = {
  nodeVersion?: string;
  uptime?: number;
  memory?: { total?: number; used?: number; free?: number; totalMB?: number; usedMB?: number; freeMB?: number; sysTotalMb?: number; sysFreeMb?: number; heapTotalMb?: number; heapUsedMb?: number; rssMb?: number; [key: string]: any };
  memoryMB?: { total?: number; used?: number; free?: number };
  cpuCount?: number;
  platform?: string;
  version?: string;
  app?: { name?: string; version?: string; env?: string; pid?: number; uptime?: number; startedAt?: string; uptimeSec?: number; [key: string]: any };
  runtime?: { node?: string; v8?: string; arch?: string; platform?: string; uptime?: number; cpus?: number; loadavg?: number[]; [key: string]: any };
  database?: { status?: string; state?: string; name?: string; host?: string; collections?: number; [key: string]: any };
  git?: { branch?: string; commit?: string; commitShort?: string; date?: string };
  changelog?: string | Array<{ version: string; date: string; notes: string }>;
  [key: string]: any;
};

export type IPAccessItem = {
  _id: string;
  ip?: string;
  ipAddress?: string;
  type: 'whitelist' | 'blacklist';
  module?: string;
  note?: string;
  reason?: string;
  hitCount?: number;
  expiresAt?: string | null;
  createdBy?: string;
  createdAt: string;
  [key: string]: any;
};

export type StaffUser = {
  _id: string;
  username: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  phone?: string;
  createdAt: string;
  lastLogin?: string;
  [key: string]: any;
};

export type RoleItem = {
  _id: string;
  name: string;
  slug?: string;
  permissions?: string[];
  perms?: string[];
  description?: string;
  isSystem?: boolean;
  createdAt: string;
  [key: string]: any;
};

export type PermissionGroup = {
  group?: string;
  key?: string;
  label?: string;
  icon?: string;
  permissions?: Array<{ key: string; label: string }>;
  perms?: Array<{ key: string; label: string }>;
  [key: string]: any;
};

export type AffiliateFeedItem = {
  _id: string;
  username: string;
  action: string;
  amount?: number;
  currency?: string;
  source?: string;
  hidden?: boolean;
  createdAt: string;
  [key: string]: any;
};

export type AffiliateMechanism = {
  commission_rates: { slots_fishing: number; others: number; lottery: number };
  referral_bonus: { inviter_reward: number; invitee_reward: number; min_deposit: number; min_valid_bet: number };
  multi_level_ratio: number;
  withdrawal_condition: { turnover_x: number; expiry_days: number };
  [key: string]: any;
};

export type AffiliateExtras = {
  vip_rebate_tiers?: AffiliateVipRebateTier[];
  [key: string]: any;
};

export type AffiliateVipRebateTier = {
  level?: number;
  rate?: number;
  label?: string;
  wagerThreshold?: number;
  rebatePercent?: number;
  [key: string]: any;
};

export type AffiliateUserRow = {
  _id: string;
  username: string;
  email?: string;
  affiliateCode?: string;
  totalReferrals?: number;
  totalCommission?: number;
  totalInvited?: number;
  validInvited?: number;
  todayExpected?: number;
  yesterdayFinal?: number;
  unclaimedBalance?: number;
  status: string;
  createdAt: string;
  [key: string]: any;
};

export type AgentRow = {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  investAmount?: number;
  interestRate?: number;
  agencyBalance?: number;
  lockUntil?: string | null;
  unlockAt?: string | null;
  depositCount?: number;
  reagentEnrolled?: boolean;
  status: string;
  createdAt: string;
  [key: string]: any;
};

export type AgentStats = {
  totalAgents?: number;
  totalInvested?: number;
  totalInterestPaid?: number;
  enrolledCount?: number;
  nonAgentCount?: number;
  feeRevenue?: number;
  feeCount?: number;
  interestTotal?: number;
  interestCount?: number;
  transferTotal?: number;
  transferCount?: number;
  commissionTotal?: number;
  commissionCount?: number;
  recent?: any[];
  [key: string]: any;
};

export type ArticlePost = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  contentHtml?: string;
  thumbnail?: string;
  categoryId?: string;
  status: 'draft' | 'published';
  featured?: boolean;
  createdAt: string;
  updatedAt?: string;
  [key: string]: any;
};

export type ArticleCategory = {
  _id: string;
  name: string;
  slug: string;
  order?: number;
  status?: boolean | string;
  createdAt: string;
  [key: string]: any;
};

export type GameItem = {
  _id: string;
  name: string;
  code?: string;
  gameKey?: string;
  externalCode?: string;
  provider?: string;
  category?: string;
  kind?: string;
  thumbnail?: string;
  image?: string;
  description?: string;
  tags?: string[];
  isActive?: boolean;
  enabled?: boolean;
  visible?: boolean;
  featured?: boolean;
  isFeatured?: boolean;
  isNew?: boolean;
  isHot?: boolean;
  favorite?: boolean;
  searchable?: boolean;
  maintenance?: boolean;
  order?: number;
  rngOverride?: { enabled?: boolean; forceLose?: boolean; forceWin?: boolean; maxPayoutPerRound?: number; maxPayoutPerUserDay?: number; targetRtpPercent?: number; biasLosePercent?: number; appliesToUserIds?: string[]; notes?: string; [key: string]: any } | null;
  [key: string]: any;
};

export type GameCategoryMeta = {
  _id?: string;
  key?: string;
  name?: string;
  code?: string;
  label?: string;
  color?: string;
  count?: number;
  enabled?: number;
  visible?: number;
  kinds?: Record<string, { count: number }>;
  [key: string]: any;
};

export type GameMenuItem = {
  key: string;
  label: string;
  icon: string;
  path: string;
  enabled: boolean;
  order: number;
  [key: string]: any;
};

export type DailyChallengeItem = {
  _id: string;
  title: string;
  description?: string;
  image?: string;
  target?: number;
  reward?: number;
  prize?: number | string;
  type?: string;
  status?: string;
  isActive?: boolean;
  createdAt: string;
  [key: string]: any;
};

export type MediaAsset = {
  _id: string;
  filename?: string;
  originalName?: string;
  mimeType?: string;
  mime?: string;
  type?: string;
  size?: number;
  url: string;
  folderId?: string;
  folder?: string;
  title?: string;
  alt?: string;
  tags?: string[];
  width?: number;
  height?: number;
  uploadedByName?: string;
  createdAt: string;
  [key: string]: any;
};

export type MediaFolder = {
  _id: string;
  name: string;
  slug?: string;
  parentId?: string;
  count?: number;
  size?: number;
  createdAt: string;
  [key: string]: any;
};

export type NewsletterRow = {
  _id: string;
  email: string;
  status: 'active' | 'unsubscribed';
  source?: string;
  ip?: string;
  createdAt: string;
  [key: string]: any;
};

export type IPackage = {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  categoryIds: string[];
  primaryCategoryId?: string;
  image?: string;
  goldCoins: number;
  freeCoins?: number;
  benefits?: string[];
  price: number;
  soldCount?: number;
  noindex?: boolean;
  order?: number;
  isActive: boolean;
  status?: string;
  [key: string]: any;
};

export type IPackageCategory = {
  _id: string;
  name: string;
  slug?: string;
  [key: string]: any;
};

export type IPlanAdmin = {
  _id: string;
  name: string;
  slug?: string;
  status: 'active' | 'inactive' | 'draft';
  price?: number;
  features?: string[];
  amountType?: number | string;
  minimum?: number;
  maximum?: number;
  amount?: number;
  createdAt: string;
  [key: string]: any;
};

export type StoreStats = {
  totalOrders?: number;
  totalRevenue?: number;
  totalPackages?: number;
  activePackages?: number;
  ordersAllTime?: number;
  revenueAllTime?: number;
  orders7d?: number;
  revenue7d?: number;
  [key: string]: any;
};

export type StoreOrderRow = {
  _id: string;
  userId: string;
  username?: string;
  packageId: string;
  packageTitle?: string;
  amount: number;
  beforeAmount?: number;
  afterAmount?: number;
  typeDescription?: string;
  status: string;
  createdAt: string;
  [key: string]: any;
};

export type SupportConversation = {
  _id: string;
  id?: string;
  userId: string;
  username?: string;
  subject?: string;
  status: 'open' | 'closed' | 'pending';
  assignedTo?: string;
  assignedAdminId?: string;
  assignedAdminName?: string;
  lastMessageAt?: string;
  lastMessageBy?: string;
  lastMessage?: string;
  unreadAdmin?: number;
  unreadByAdmin?: number;
  tags?: string[];
  internalNote?: string;
  createdAt: string;
  [key: string]: any;
};

export type SupportMessage = {
  _id: string;
  id?: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  senderRole: 'user' | 'admin' | 'system';
  content?: string;
  text?: string;
  readAt?: string;
  createdAt: string;
  [key: string]: any;
};

export type SupportStats = {
  total?: number;
  open?: number;
  pending?: number;
  closed?: number;
  unread?: number;
  totalUnread?: number;
  [key: string]: any;
};

export type TelegramTemplate = {
  _id?: string;
  key: string;
  event?: string;
  target: 'admin' | 'user';
  enabled: boolean;
  template?: string;
  content?: string;
  color?: string;
  [key: string]: any;
};

export type TelegramEventDef = {
  key: string;
  label: string;
  target?: 'admin' | 'user';
  defaultTemplate?: string;
  defaultContent?: string;
  variables?: string[];
  color?: string;
  [key: string]: any;
};

export type EmailConfigPayload = {
  provider?: string;
  apiKey?: string;
  fromEmail?: string;
  fromName?: string;
  from?: string;
  replyTo?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  smtpSecure?: boolean;
  enabled?: boolean;
  [key: string]: any;
};

export type EmailEventDef = {
  key: string;
  label?: string;
  target?: string;
  defaultSubject?: string;
  defaultHtml?: string;
  variables?: string[];
  enabled?: boolean;
  subject?: string;
  html?: string;
  [key: string]: any;
};

export type RealtimeEventItem = {
  _id?: string;
  id?: string;
  type: string;
  timestamp?: string;
  username?: string;
  gameName?: string;
  amount?: number;
  details?: string | Record<string, unknown>;
  severity?: string;
  payload?: Record<string, unknown>;
  createdAt?: string;
  [key: string]: any;
};

export type NowpayCurrency = {
  _id: string;
  currency?: string;
  code?: string;
  name?: string;
  ticker?: string;
  network?: string;
  isEnabled?: boolean;
  status?: string;
  usd?: number;
  minAmount?: number;
  [key: string]: any;
};


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

// Fallback dynamic proxy — chỉ dùng cho functions thực sự không cần typed
export const api = new Proxy(
  {},
  {
    get: (_, prop: string) => (...args: any[]) => req(`/${prop}`, { method: 'POST', body: JSON.stringify(args[0] || {}) }),
  },
);

export default api;
