import { ReactNode, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ADMIN_SIDEBAR,
  filterAdminSidebar,
} from "@/components/layout/adminSidebarData";
import { AdminNavMenu } from "@/components/layout/AdminNavTree";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@game/ui/sidebar";
import { Badge } from "@game/ui/badge";
import { Separator } from "@game/ui/separator";
import { Button } from "@game/ui/button";
import ThemeToggle from "@/components/shared/ThemeToggle";
import { toast } from "@game/ui/use-toast";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { useAdminThemeVars } from "@/hooks/useAdminThemeVars";
import AdminErrorBoundary from "@/components/admin/AdminErrorBoundary";
import { getAdminToken } from "@/lib/adminAuth";
import { logout } from "@/lib/api";
import { Input } from "@game/ui/input";
import { Search } from "lucide-react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [navQuery, setNavQuery] = useState("");
  const sidebarSections = useMemo(
    () => filterAdminSidebar(ADMIN_SIDEBAR, navQuery),
    [navQuery],
  );

  // Automatically logout after 1 hour of inactivity
  useSessionTimeout();
  useAdminThemeVars();

  return (
    <div
      className="dark min-h-screen bg-background"
      style={{ backgroundColor: "var(--adm-background, hsl(var(--background)))" }}
    >
      <SidebarProvider>
        <Sidebar collapsible="icon" variant="inset">
          <SidebarHeader>
            <div className="flex items-center gap-2 px-2 py-1.5">
              <div className="size-6 rounded-md bg-gradient-to-br from-brand-500 via-brand-400 to-teal-400" />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <Link
                  to="/dashboard"
                  className="font-semibold tracking-tight text-sm leading-none"
                >
                  Bảng điều khiển
                </Link>
                <span className="truncate text-[10px] text-muted-foreground">
                  Ví · Đại lý · Affiliate · Nội dung
                </span>
              </div>
              <Badge variant="secondary" className="ml-auto shrink-0">
                Super
              </Badge>
            </div>
            <div className="px-2 pb-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={navQuery}
                  onChange={(e) => setNavQuery(e.target.value)}
                  placeholder="Tìm menu…"
                  className="h-8 pl-8 text-xs"
                  aria-label="Tìm kiếm menu điều hướng"
                />
              </div>
            </div>
            <SidebarSeparator />
          </SidebarHeader>
          <SidebarContent>
            {sidebarSections.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                Không có mục nào khớp &quot;{navQuery}&quot;. Xóa ô tìm để xem toàn bộ menu.
              </p>
            ) : null}
            {sidebarSections.map((section) => (
              <SidebarGroup key={section.title}>
                <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.title}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <AdminNavMenu items={section.items} />
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>
          <SidebarFooter>
            <SidebarSeparator />
            <div className="flex items-center justify-between px-2 py-1.5 text-xs text-muted-foreground">
              <span>Trung tâm điều hành</span>
            </div>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>

        <SidebarInset>
          <div className="sticky top-0 z-20 border-b border-border/40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/65">
            <div className="flex items-center gap-3 px-4 py-2.5">
              <SidebarTrigger />
              <Separator orientation="vertical" className="h-6" />
              <div className="ml-auto flex items-center gap-2">
                <ThemeToggle />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    let ok = false;
                    try {
                      const t = getAdminToken() || "";
                      if (t) {
                        await logout(t);
                        ok = true;
                      }
                    } catch {}
                    localStorage.removeItem("adminAccessToken");
                    localStorage.removeItem("role");
                    if (ok) toast({ title: "Đã đăng xuất" });
                    else
                      toast({
                        title: "Đã đăng xuất cục bộ",
                        description: "Phiên đăng nhập có thể đã hết hạn.",
                      });
                    window.location.assign("/login");
                  }}
                >
                  Đăng xuất
                </Button>
              </div>
            </div>
          </div>
          <div className="pb-10 pt-5">
            <div className="app-shell-content max-w-[min(100%,1920px)]">
              <AdminErrorBoundary>{children}</AdminErrorBoundary>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
