import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  adminLogin,
  adminLogout,
  adminMe,
  clearAdminAuth,
  getAdminToken,
  setAdminToken,
} from "@/lib/adminAuth";

export type AuthContextValue = {
  user: any | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const t = getAdminToken();
      const cachedRole = localStorage.getItem("role");
      if (!t) {
        setLoading(false);
        return;
      }
      if (cachedRole) {
        setUser({ role: cachedRole });
        setToken(t);
        setLoading(false);
        return;
      }
      try {
        const me = await adminMe(t);
        setUser(me?.user ?? null);
        setToken(t);
      } catch {
        setUser(null);
        setToken(null);
        clearAdminAuth();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (username: string, password: string) => {
    const res = await adminLogin(username, password);
    setAdminToken(res.accessToken);
    const raw = String(res?.user?.role ?? "Admin");
    const norm =
      raw.toLowerCase() === "admin"
        ? "Admin"
        : raw.toLowerCase() === "owner"
          ? "Owner"
          : raw;
    localStorage.setItem("role", norm);
    setToken(res.accessToken);
    setUser(res.user ?? null);
  };

  const logout = async () => {
    const t = getAdminToken();
    try {
      if (t) await adminLogout(t);
    } finally {
      clearAdminAuth();
      setUser(null);
      setToken(null);
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, loading, login, logout }),
    [user, token, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
