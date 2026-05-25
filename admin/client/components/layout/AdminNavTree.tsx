import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import type {
  AdminNavLeaf,
  AdminNavNode,
  AdminNavParent,
} from "@/components/layout/adminSidebarData";

function isParent(node: AdminNavNode): node is AdminNavParent {
  return (node as AdminNavParent).children !== undefined;
}

function pathMatches(to: string, pathname: string, search: string) {
  if (!to.includes("?")) return pathname === to;
  const q = to.indexOf("?");
  const path = to.slice(0, q);
  const wantQs = to.slice(q + 1);
  if (pathname !== path) return false;
  const curQs = search.startsWith("?") ? search.slice(1) : search;
  if (curQs === wantQs) return true;
  const want = new URLSearchParams(wantQs);
  const cur = new URLSearchParams(curQs);
  for (const [k, v] of want) {
    if (cur.get(k) !== v) return false;
  }
  return true;
}

function LeafItem({ item }: { item: AdminNavLeaf }) {
  const location = useLocation();
  const active = pathMatches(item.to, location.pathname, location.search);
  const Icon = item.icon;
  return (
    <SidebarMenuItem>
      <NavLink to={item.to} className="block">
        {({ isActive }) => (
          <SidebarMenuButton isActive={isActive || active} tooltip={item.label}>
            <Icon className="text-sidebar-foreground" />
            <span>{item.label}</span>
          </SidebarMenuButton>
        )}
      </NavLink>
    </SidebarMenuItem>
  );
}

function ParentItem({ item }: { item: AdminNavParent }) {
  const location = useLocation();
  const Icon = item.icon;

  const childActive = useMemo(
    () =>
      item.children.some((c) =>
        pathMatches(c.to, location.pathname, location.search),
      ),
    [item.children, location.pathname, location.search],
  );

  const [open, setOpen] = useState<boolean>(childActive);
  useEffect(() => {
    if (childActive) setOpen(true);
  }, [childActive]);

  return (
    <Collapsible open={open} onOpenChange={setOpen} asChild>
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip={item.label}
            isActive={childActive}
            className="group/collapsible"
          >
            <Icon className="text-sidebar-foreground" />
            <span className="flex-1 text-left">{item.label}</span>
            <ChevronRight
              className={
                "ml-auto size-4 shrink-0 transition-transform duration-200 " +
                (open ? "rotate-90" : "")
              }
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.children.map((c) => {
              const ChildIcon = c.icon;
              const active = pathMatches(
                c.to,
                location.pathname,
                location.search,
              );
              return (
                <SidebarMenuSubItem key={`${item.label}-${c.to}`}>
                  <NavLink to={c.to}>
                    {({ isActive }) => (
                      <SidebarMenuSubButton
                        asChild
                        isActive={isActive || active}
                      >
                        <span className="flex items-center gap-2">
                          <ChildIcon className="size-3.5 opacity-80" />
                          <span className="truncate">{c.label}</span>
                        </span>
                      </SidebarMenuSubButton>
                    )}
                  </NavLink>
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

export function AdminNavMenu({
  items,
}: {
  items: AdminNavNode[];
}) {
  return (
    <SidebarMenu>
      {items.map((node, idx) =>
        isParent(node) ? (
          <ParentItem key={`p-${node.label}-${idx}`} item={node} />
        ) : (
          <LeafItem key={`l-${node.to}-${idx}`} item={node} />
        ),
      )}
    </SidebarMenu>
  );
}
