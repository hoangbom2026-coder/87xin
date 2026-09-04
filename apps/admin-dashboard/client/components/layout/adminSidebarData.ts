import type { LucideIcon } from 'lucide-react'
import { LayoutDashboard, Users, Shield, Gamepad2, Settings, FileText } from 'lucide-react'

export interface AdminNavLeaf {
  to: string
  icon: LucideIcon | any
  label: string
}

export interface AdminNavParent {
  label: string
  icon: LucideIcon | any
  children: AdminNavLeaf[]
}

export type AdminNavNode = AdminNavLeaf | AdminNavParent

export interface AdminSidebarSection {
  title: string
  items: AdminNavNode[]
}

export const ADMIN_SIDEBAR: AdminSidebarSection[] = [
  {
    title: 'Management',
    items: [
      { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/admin/users', icon: Users, label: 'Users' },
      { to: '/admin/games', icon: Gamepad2, label: 'Games' },
      { to: '/admin/audit', icon: Shield, label: 'Audit Logs' },
      { to: '/admin/settings', icon: Settings, label: 'Settings' },
    ],
  },
]

export function filterAdminSidebar(
  sections: AdminSidebarSection[],
  query: string,
): AdminSidebarSection[] {
  if (!query.trim()) return sections
  const q = query.toLowerCase()
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if ('children' in item && item.children) {
          return (
            item.label.toLowerCase().includes(q) ||
            item.children.some((c) => c.label.toLowerCase().includes(q))
          )
        }
        return item.label.toLowerCase().includes(q)
      }),
    }))
    .filter((section) => section.items.length > 0)
}
