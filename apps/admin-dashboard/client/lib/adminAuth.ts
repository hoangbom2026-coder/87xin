/**
 * Admin authentication helpers for admin-dashboard.
 * Normalizes backend auth payload (token -> accessToken) and manages localStorage tokens.
 */
import { loginAdmin, getMe, logout } from "./api";

export type AdminLoginResponse = {
  user: any;
  accessToken: string;
};

export async function adminLogin(username: string, password: string): Promise<AdminLoginResponse> {
  const raw = await loginAdmin(username, password);
  // Backend response: { user, token, tokens: { access: { token } } }
  const resolvedToken = raw?.accessToken ?? raw?.token ?? raw?.tokens?.access?.token;
  if (!resolvedToken) {
    throw new Error('Đăng nhập thất bại: không nhận được token xác thực');
  }
  return {
    user: raw?.user ?? null,
    accessToken: resolvedToken,
  };
}

export async function adminMe(token: string) {
  try {
    return await getMe(token);
  } catch (e) {
    return { user: null } as any;
  }
}

export async function adminLogout(token: string) {
  return logout(token);
}

export function getAdminToken(): string | null {
  return localStorage.getItem("adminAccessToken");
}

export function setAdminToken(token: string) {
  localStorage.setItem("adminAccessToken", token);
}

export function clearAdminAuth() {
  localStorage.removeItem("adminAccessToken");
  localStorage.removeItem("role");
}
