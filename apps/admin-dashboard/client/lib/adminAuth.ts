export type AdminLoginResponse = {
  user: any;
  accessToken: string;
};

import { loginAdmin, getMe, logout } from "./api";

export async function adminLogin(username: string, password: string): Promise<AdminLoginResponse> {
  return loginAdmin(username, password);
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
