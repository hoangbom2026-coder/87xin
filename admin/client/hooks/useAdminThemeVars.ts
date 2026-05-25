import * as React from "react";
import { getAdminToken } from "@/lib/adminAuth";
import { getBusinessSettings } from "@/lib/api";
import { mergeAdminMain } from "@/lib/ui-theme-defaults";

function slugKey(k: string) {
  return k.replace(/[^a-zA-Z0-9_-]/g, "-");
}

/** Áp `uiTheme.adminMain` → `--adm-<token>` trên `document.documentElement`. */
export function useAdminThemeVars() {
  React.useEffect(() => {
    const t = getAdminToken();
    if (!t) return;

    let cancelled = false;

    async function apply() {
      try {
        const doc = (await getBusinessSettings(t)) as Record<string, unknown>;
        if (cancelled) return;
        const raw = doc?.uiTheme as { adminMain?: Record<string, string> } | undefined;
        const merged = mergeAdminMain(raw?.adminMain || null);
        const root = document.documentElement;
        Object.entries(merged).forEach(([k, v]) => {
          root.style.setProperty(`--adm-${slugKey(k)}`, String(v));
        });
      } catch {
        /* giữ theme mặc định tailwind */
      }
    }

    apply();
    const onUp = () => apply();
    window.addEventListener("admin-theme-updated", onUp);
    return () => {
      cancelled = true;
      window.removeEventListener("admin-theme-updated", onUp);
    };
  }, []);
}
