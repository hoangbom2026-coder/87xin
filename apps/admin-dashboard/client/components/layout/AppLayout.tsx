import { ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@game/ui/sidebar";
import { Badge } from "@game/ui/badge";
import { Input } from "@game/ui/input";
import { Button } from "@game/ui/button";
import {
  Bell,
  Blocks,
  BookOpenText,
  CalendarDays,
  ChartBarBig,
  CircleUserRound,
  Cog,
  GitBranch,
  Headphones,
  Home,
  Layers3,
  MessagesSquare,
  PhoneCall,
  Puzzle,
  Users,
  Waypoints,
  Search,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@game/ui/dropdown-menu";
import { Separator } from "@game/ui/separator";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/shared/ThemeToggle";
import ChatWidget from "@/components/widget/ChatWidget";

function navMatches(to: string, pathname: string, search: string) {
  if (!to.includes("?")) return pathname === to;
  const q = to.indexOf("?");
  const path = to.slice(0, q);
  const want = to.slice(q + 1);
  if (pathname !== path) return false;
  const cur = search.startsWith("?") ? search.slice(1) : search;
  return cur === want;
}

export function NavItem({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: any;
  label: string;
}) {
  const location = useLocation();
  const active = navMatches(to, location.pathname, location.search);
  return (
    <SidebarMenuItem>
      <NavLink to={to} className="block">
        {({ isActive }) => (
          <SidebarMenuButton isActive={isActive || active} tooltip={label}>
            <Icon className="text-sidebar-foreground" />
            <span>{label}</span>
          </SidebarMenuButton>
        )}
      </NavLink>
    </SidebarMenuItem>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" variant="inset">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="size-6 rounded-md bg-gradient-to-br from-brand-500 via-brand-400 to-teal-400" />
            <Link to="/" className="font-semibold tracking-tight text-sm">
              Proficient AI
            </Link>
            <Badge variant="secondary" className="ml-auto">
              Beta
            </Badge>
          </div>
          <SidebarSeparator />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <NavItem to="/" icon={Home} label="Dashboard" />
                <NavItem
                  to="/conversations"
                  icon={MessagesSquare}
                  label="Conversations"
                />
                <NavItem to="/crm" icon={Users} label="CRM" />
                <NavItem to="/calendar" icon={CalendarDays} label="Calendar" />
                <NavItem
                  to="/knowledge"
                  icon={BookOpenText}
                  label="Knowledge Base"
                />
                <NavItem to="/voice" icon={PhoneCall} label="Voice & AI" />
                <NavItem to="/workflows" icon={GitBranch} label="Workflows" />
                <NavItem
                  to="/integrations"
                  icon={Puzzle}
                  label="Integrations"
                />
                <NavItem to="/reports" icon={ChartBarBig} label="Reports" />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarSeparator />
          <SidebarMenu>
            <NavItem to="/settings" icon={Cog} label="Settings" />
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <TopBar />
        <div className="pb-8 pt-4">
          <div className="app-shell-content">{children}</div>
        </div>
        <ChatWidget />
      </SidebarInset>
    </SidebarProvider>
  );
}

export function TopBar() {
  return (
    <div className="sticky top-0 z-20 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-3 border-b px-4 py-2">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-6" />
        <div className="relative ml-1 hidden md:block w-full max-w-md">
          <Input className="pl-9 h-9" placeholder="Search..." />
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="size-5" />
          </Button>
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <CircleUserRound className="size-5" />
                <span className="hidden sm:inline">Mustapha</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>Billing</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <BrandBanner />
    </div>
  );
}

function BrandBanner() {
  return (
    <div className="px-6 py-2">
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border",
          "bg-gradient-to-r from-brand-600 via-brand-500 to-teal-500 text-white",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]",
        )}
      >
        <div className="flex items-center gap-3 px-4 py-2">
          <Layers3 className="size-5 opacity-90" />
          <p className="text-sm/5 font-medium">
            Proficient AI — Autonomous assistants for support, voice, outreach
            and sales.
          </p>
          <div className="ml-auto flex items-center gap-2">
            <Button
              asChild
              size="sm"
              className="bg-white text-brand-700 hover:bg-white/90"
            >
              <Link to="/integrations">Connect apps</Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant="secondary"
              className="bg-white/15 text-white hover:bg-white/20"
            >
              <Link to="/workflows">Create workflow</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
