import { affiliateLogin as apiAffiliateLogin, affiliateLogout as apiAffiliateLogout, affiliateMe as apiAffiliateMe } from "@/lib/affiliateApi";

export type AffiliateLoginResponse = { affiliate: any; accessToken: string };

export async function affiliateLogin(username: string, password: string): Promise<AffiliateLoginResponse> {
  return apiAffiliateLogin(username, password);
}

export async function affiliateMe(token: string) {
  try {
    return await apiAffiliateMe(token);
  } catch (e) {
    return null as any;
  }
}

export async function affiliateLogout(token: string) {
  return apiAffiliateLogout(token);
}

export function getAffiliateToken(): string | null {
  return localStorage.getItem("affiliateAccessToken");
}
export function setAffiliateToken(token: string) {
  localStorage.setItem("affiliateAccessToken", token);
}
export function clearAffiliateAuth() {
  localStorage.removeItem("affiliateAccessToken");
}
