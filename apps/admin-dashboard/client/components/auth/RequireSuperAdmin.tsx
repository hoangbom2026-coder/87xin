import * as React from "react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import NotFound from "@/pages/NotFound";
import { adminMe, getAdminToken, clearAdminAuth } from "@/lib/adminAuth";
import { toast } from "@/components/ui/use-toast";

type Role = "Owner" | "Admin" | "Agent" | "Analyst";
export default function RequireSuperAdmin({
  children,
}: {
  children: React.ReactNode;
}) {
  const [role, setRole] = useState<Role | null>(null);
  const [checked, setChecked] = useState(false);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const navigate = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    (async () => {
      const token = getAdminToken();
      const localRaw = localStorage.getItem("role");
      console.log("[RequireSuperAdmin] token:", !!token, "localRole:", localRaw);

      if (localRaw) {
        setRole(localRaw as Role);
        setChecked(true);
        return;
      }

      if (token) {
        try {
          const me = await adminMe(token);
          const r = (me?.user?.role as string | undefined) ?? null;
          console.log("[RequireSuperAdmin] API role:", r);
          if (r) {
            localStorage.setItem("role", r);
            setRole(r as Role);
            setChecked(true);
            return;
          }
        } catch (error) {
          console.error("[RequireSuperAdmin] Auth check failed:", error);
          clearAdminAuth();
        }
      }
      setChecked(true);
      setRedirectTo("/login");
    })();
  }, []);

  useEffect(() => {
    if (!checked) return;
    if (!role) {
      if (!redirectTo) setRedirectTo("/login");
      return;
    }
    const rLower = role.toLowerCase();
    const isAllowed = rLower === "owner" || rLower === "admin" || rLower === "superadmin";
    console.log("[RequireSuperAdmin] checked:", checked, "role:", role, "isAllowed:", isAllowed);
    setForbidden(!isAllowed);
  }, [checked, role]);

  useEffect(() => {
    if (redirectTo) navigate(redirectTo, { replace: true });
  }, [redirectTo, navigate]);

  if (!checked) {
    return (
      <div className="min-h-[40vh] grid place-items-center p-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <svg
            className="size-4 animate-spin"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            ></path>
          </svg>
          <span>Checking admin access…</span>
        </div>
      </div>
    );
  }
  if (redirectTo) {
    return (
      <div className="min-h-[40vh] grid place-items-center p-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <svg
            className="size-4 animate-spin"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            ></path>
          </svg>
          <span>Redirecting to login…</span>
        </div>
      </div>
    );
  }
  if (forbidden) return <NotFound />;
  return <>{children}</>;
}
