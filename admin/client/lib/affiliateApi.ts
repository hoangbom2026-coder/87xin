const envBase = typeof import.meta !== "undefined" ? (import.meta as any).env?.VITE_HOST_API : undefined;
const lsBase = typeof window !== "undefined" && typeof localStorage !== "undefined" ? localStorage.getItem("__API_BASE") : null;
const winBase = (typeof window !== "undefined" && (window as any).__API_BASE) || undefined;
const originApi = typeof window !== "undefined" ? `${window.location.origin}/api` : undefined;
const API_BASE = (lsBase && lsBase.trim()) || winBase || (envBase && envBase.trim() && envBase.trim() !== "/api" ? envBase.trim() : "http://localhost:5000/api");

function join(base: string, p: string) {
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const q = p.startsWith("/") ? p : `/${p}`;
  return `${b}${q}`;
}

async function request<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
  const originalBody = init?.body as any;
  const isFormData = typeof FormData !== "undefined" && originalBody instanceof FormData;
  const headers: Record<string, string> = { ...(init?.headers as any) };
  if (!isFormData) headers["Content-Type"] = headers["Content-Type"] || "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  function cloneBody(body: any): any {
    if (body == null) return body;
    if (typeof body === "string") return body;
    if (typeof URLSearchParams !== "undefined" && body instanceof URLSearchParams) {
      return new URLSearchParams(body as any);
    }
    if (typeof FormData !== "undefined" && body instanceof FormData) {
      const fd = new FormData();
      (body as FormData).forEach((v, k) => fd.append(k, v));
      return fd;
    }
    if (typeof Blob !== "undefined" && body instanceof Blob) {
      return (body as Blob).slice();
    }
    if (body instanceof ArrayBuffer) {
      return body.slice(0);
    }
    return body; // best effort
  }

  const candidates = Array.from(new Set([API_BASE, originApi, "/api", "http://localhost:5000/api"].filter(Boolean) as string[]));
  for (let i = 0; i < candidates.length; i++) {
    try {
      const attemptInit: RequestInit = { cache: "no-store", ...init, headers: { "Cache-Control": "no-cache", ...headers }, mode: "cors" };
      if (typeof originalBody !== "undefined") attemptInit.body = cloneBody(originalBody);
      const res = await fetch(join(candidates[i]!, path), attemptInit);
      if (res.ok) {
        const ct = res.headers.get("content-type") || "";
        return (ct.includes("application/json") ? ((await res.json()) as T) : (undefined as unknown as T));
      }
      if (res.status >= 500) {
        await new Promise((r) => setTimeout(r, 200));
        const retryInit: RequestInit = { cache: "no-store", ...init, headers: { "Cache-Control": "no-cache", ...headers }, mode: "cors" };
        if (typeof originalBody !== "undefined") retryInit.body = cloneBody(originalBody);
        const retry = await fetch(join(candidates[i]!, path), retryInit);
        if (retry.ok) {
          const ct = retry.headers.get("content-type") || "";
          return (ct.includes("application/json") ? ((await retry.json()) as T) : (undefined as unknown as T));
        }
      } else {
        // For non-5xx, don't try the next base with the same body to avoid duplicate submissions
        break;
      }
    } catch {}
  }
  return undefined as unknown as T;
}

// Auth (affiliate)
export async function affiliateLogin(username: string, password: string) {
  return request<{ affiliate: any; accessToken: string }>(`/auth/affiliate/login`, {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}
export async function affiliateLogout(token: string) {
  return request<void>(`/auth/affiliate/logout`, { method: "POST" }, token);
}
export async function affiliateMe(token: string) {
  return request<any>(`/auth/affiliate/me`, { method: "GET" }, token);
}

export async function affiliateRegister(payload: { email: string; username: string; firstName: string; lastName: string; password: string; referralCode: string }) {
  const headers: Record<string, string> = { "Content-Type": "application/json", "Cache-Control": "no-cache" };
  const candidates = Array.from(new Set([API_BASE, "/api", "http://localhost:5000/api"].filter(Boolean) as string[]));
  let lastErr: any;
  for (let i = 0; i < candidates.length; i++) {
    try {
      const res = await fetch(join(candidates[i]!, "/auth/affiliate/register"), {
        method: "POST",
        body: JSON.stringify(payload),
        headers,
        cache: "no-store",
        mode: "cors",
      });
      const ct = res.headers.get("content-type") || "";
      const raw = await res.text().catch(() => "");
      if (res.ok) {
        if (ct.includes("application/json")) {
          try { return JSON.parse(raw || "{}") as { affiliate: any; accessToken: string }; } catch {}
        }
        return { affiliate: null as any, accessToken: "" };
      }
      let parsed: any = undefined;
      if (ct.includes("application/json")) {
        try { parsed = JSON.parse(raw || ""); } catch {}
      }
      const message = (parsed && parsed.message) || raw || `HTTP ${res.status}`;
      lastErr = new Error(message);
      if (res.status >= 500) {
        await new Promise((r) => setTimeout(r, 150));
        i--; // retry same candidate once
        continue;
      }
      break;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("Registration failed");
}

// Affiliate endpoints
export async function affiliateUpdate(data: Record<string, any>, token: string) {
  return request<any>(`/affiliate`, { method: "PUT", body: JSON.stringify(data) }, token);
}
export async function affiliateReferralCount(token: string) {
  return request<{ affiliate: any; user: any }>(`/affiliate/referral-count`, { method: "GET" }, token);
}
export async function affiliateDashboard(duration: string | undefined, token: string) {
  const q = duration ? `?duration=${encodeURIComponent(duration)}` : "";
  return request<any>(`/affiliate/dashboard${q}`, { method: "GET" }, token);
}
export async function affiliateDashboardAnalysis(payload: any, token: string) {
  return request<any>(`/affiliate/dashboard/analysis`, { method: "POST", body: JSON.stringify(payload) }, token);
}
export async function affiliateDashboardChildren(payload: any, token: string) {
  return request<any>(`/affiliate/dashboard/children`, { method: "POST", body: JSON.stringify(payload) }, token);
}
export async function affiliateChildren(payload: any, token: string) {
  return request<any>(`/affiliate/children`, { method: "POST", body: JSON.stringify(payload) }, token);
}
export async function affiliateUsers(payload: any, token: string) {
  return request<any>(`/affiliate/users`, { method: "POST", body: JSON.stringify(payload) }, token);
}
export async function affiliateCommission(token: string) {
  return request<any>(`/affiliate/commission`, { method: "GET" }, token);
}
export async function affiliateUpdateCommission(data: any, token: string) {
  return request<any>(`/affiliate/commission`, { method: "PUT", body: JSON.stringify(data) }, token);
}
export async function affiliateTree(token: string) {
  return request<any>(`/affiliate/tree-affiliates`, { method: "GET" }, token);
}
export async function affiliateUpdatePassword(payload: { oldPassword: string; newPassword: string }, token: string) {
  return request<void>(`/affiliate/password`, { method: "PATCH", body: JSON.stringify(payload) }, token);
}
