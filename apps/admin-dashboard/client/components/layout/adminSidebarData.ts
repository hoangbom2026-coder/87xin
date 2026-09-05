/**
 * Navigation metadata and sections for admin sidebar.
 * Comprehensive mapping of 70+ admin pages with semantic icons and grouped categories.
 */
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Users,
  Shield,
  ClipboardList,
  Settings,
  Headphones,
  BadgeCheck,
  ArrowDownCircle,
  ArrowUpCircle,
  CreditCard,
  DollarSign,
  TrendingUp,
  Gamepad2,
  Menu,
  Network,
  Trophy,
  Crown,
  Star,
  BarChart2,
  Settings2,
  Gift,
  Percent,
  Package,
  FileText,
  ShoppingBag,
  Globe,
  UserCheck,
  UserPlus,
  Receipt,
  Users2,
  Share2,
  Image,
  Tag,
  Layout,
  BookOpen,
  FolderOpen,
  Megaphone,
  HelpCircle,
  MessageSquare,
  Puzzle,
  Send,
  Mail,
  Clock,
  Bot,
  RefreshCw,
  Languages,
  Palette,
  Activity,
  AlertTriangle,
  MessageCircle,
  Ticket,
} from 'lucide-react';

export interface AdminNavLeaf {
  to: string;
  icon: LucideIcon | any;
  label: string;
}

export interface AdminNavParent {
  label: string;
  icon: LucideIcon | any;
  children: AdminNavLeaf[];
}

export type AdminNavNode = AdminNavLeaf | AdminNavParent;

export interface AdminSidebarSection {
  title: string;
  items: AdminNavNode[];
}

export const ADMIN_SIDEBAR: AdminSidebarSection[] = [
  {
    title: 'Core',
    items: [
      { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/admin/admins', icon: Users, label: 'Admins' },
      { to: '/admin/roles', icon: Shield, label: 'Roles' },
      { to: '/admin/audit-logs', icon: ClipboardList, label: 'Audit Logs' },
      { to: '/admin/preferences', icon: Settings, label: 'Preferences' },
      { to: '/admin/brand-settings', icon: Palette, label: 'Brand Settings' },
    ],
  },
  {
    title: 'Users & Finance',
    items: [
      { to: '/admin/customer-care', icon: Headphones, label: 'Customer Care' },
      { to: '/admin/kyc', icon: BadgeCheck, label: 'KYC' },
      { to: '/admin/deposits', icon: ArrowDownCircle, label: 'Deposits' },
      { to: '/admin/withdrawals', icon: ArrowUpCircle, label: 'Withdrawals' },
      { to: '/admin/manual-payments', icon: CreditCard, label: 'Manual Payments' },
      { to: '/admin/currencies', icon: DollarSign, label: 'Currencies' },
      { to: '/admin/invest-logs', icon: TrendingUp, label: 'Invest Logs' },
    ],
  },
  {
    title: 'Gaming',
    items: [
      { to: '/admin/games', icon: Gamepad2, label: 'Games' },
      { to: '/admin/game-menu', icon: Menu, label: 'Game Menu' },
      { to: '/admin/gateways', icon: Network, label: 'Gateways' },
      { to: '/admin/daily-challenges', icon: Trophy, label: 'Daily Challenges' },
    ],
  },
  {
    title: 'VIP & Rewards',
    items: [
      { to: '/admin/vip-hub', icon: Crown, label: 'VIP Hub' },
      { to: '/admin/vip-tiers', icon: Star, label: 'VIP Tiers' },
      { to: '/admin/vip-levels', icon: BarChart2, label: 'VIP Levels' },
      { to: '/admin/vip-program', icon: Settings2, label: 'VIP Config' },
      { to: '/admin/rewards', icon: Gift, label: 'Rewards' },
      { to: '/admin/bonuses', icon: Percent, label: 'Bonuses' },
      { to: '/admin/packages', icon: Package, label: 'Packages' },
      { to: '/admin/plans', icon: FileText, label: 'Plans' },
      { to: '/admin/store', icon: ShoppingBag, label: 'Store' },
    ],
  },
  {
    title: 'Affiliate & Agency',
    items: [
      { to: '/admin/affiliates', icon: Network, label: 'Affiliates' },
      { to: '/admin/affiliate-hub', icon: Globe, label: 'Affiliate Hub' },
      { to: '/admin/affiliate-manager', icon: UserCheck, label: 'Affiliate Manager' },
      { to: '/admin/affiliate-program', icon: Settings, label: 'Affiliate Config' },
      { to: '/admin/affiliate-signups', icon: UserPlus, label: 'Signups' },
      { to: '/admin/commission-logs', icon: Receipt, label: 'Commission Logs' },
      { to: '/admin/agents', icon: Users2, label: 'Agents' },
      { to: '/admin/referrals', icon: Share2, label: 'Referrals' },
    ],
  },
  {
    title: 'Content & Marketing',
    items: [
      { to: '/admin/banners', icon: Image, label: 'Banners' },
      { to: '/admin/promotions', icon: Tag, label: 'Promotions' },
      { to: '/admin/content-blocks', icon: Layout, label: 'Content Blocks' },
      { to: '/admin/articles', icon: BookOpen, label: 'Articles' },
      { to: '/admin/media', icon: FolderOpen, label: 'Media Library' },
      { to: '/admin/marketing-hub', icon: Megaphone, label: 'Marketing Hub' },
      { to: '/admin/help-center', icon: HelpCircle, label: 'Help Center' },
      { to: '/admin/site-content', icon: MessageSquare, label: 'Site Content' },
    ],
  },
  {
    title: 'System',
    items: [
      { to: '/admin/plugins', icon: Puzzle, label: 'Plugins' },
      { to: '/admin/telegram', icon: Send, label: 'Telegram' },
      { to: '/admin/email-settings', icon: Mail, label: 'Email Settings' },
      { to: '/admin/schedules', icon: Clock, label: 'Schedules' },
      { to: '/admin/bot-automation', icon: Bot, label: 'Bot Automation' },
      { to: '/admin/system-updates', icon: RefreshCw, label: 'System Updates' },
      { to: '/admin/languages', icon: Languages, label: 'Languages' },
      { to: '/admin/theme-editor', icon: Palette, label: 'Theme Editor' },
      { to: '/admin/realtime-monitor', icon: Activity, label: 'Realtime Monitor' },
      { to: '/admin/churn', icon: AlertTriangle, label: 'Churn Risk' },
    ],
  },
  {
    title: 'Support',
    items: [
      { to: '/admin/support-chat', icon: MessageCircle, label: 'Support Chat' },
      { to: '/admin/tickets', icon: Ticket, label: 'Tickets' },
      { to: '/admin/newsletter', icon: Mail, label: 'Newsletter' },
    ],
  },
];

export function filterAdminSidebar(
  sections: AdminSidebarSection[],
  query: string,
): AdminSidebarSection[] {
  if (!query.trim()) return sections;
  const q = query.toLowerCase();
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if ('children' in item && item.children) {
          return (
            item.label.toLowerCase().includes(q) ||
            item.children.some((c) => c.label.toLowerCase().includes(q))
          );
        }
        return item.label.toLowerCase().includes(q);
      }),
    }))
    .filter((section) => section.items.length > 0);
}
