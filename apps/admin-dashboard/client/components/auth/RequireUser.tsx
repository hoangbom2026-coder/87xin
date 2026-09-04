import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import NotFound from "@/pages/NotFound";

type Role = "Owner" | "Admin" | "Agent" | "Analyst";
type Me = { user?: { role?: Role } };

export default function RequireUser({
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
    const local = (localStorage.getItem("role") as Role | null) ?? null;
    if (local) {
      setRole(local);
      setChecked(true);
      return;
    }
    setChecked(true);
    setRedirectTo("/login");
  }, [loc.pathname]);

  useEffect(() => {
    if (!checked) return;
    if (!role) {
      setRedirectTo("/login");
      return;
    }
    if (role === "Owner" || role === "Admin") setForbidden(true);
  }, [checked, role]);

  useEffect(() => {
    if (redirectTo) navigate(redirectTo, { replace: true });
  }, [redirectTo, navigate]);

  if (!checked) return null;
  if (redirectTo) return null;
  if (forbidden) return <NotFound />;
  return <>{children}</>;
}
