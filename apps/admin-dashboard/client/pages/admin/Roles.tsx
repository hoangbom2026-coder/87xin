import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@game/ui/button";
import { Input } from "@game/ui/input";
import { Textarea } from "@game/ui/textarea";
import { Badge } from "@game/ui/badge";
import { Checkbox } from "@game/ui/checkbox";
import { ScrollArea } from "@game/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@game/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@game/ui/alert-dialog";
import { toast } from "@game/ui/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@game/ui/tabs";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Plus,
  Trash2,
  Save,
  Search,
  Info,
  Lock,
  Copy,
  Users,
  Heart,
  Wallet,
  Network,
  Megaphone,
  Briefcase,
  Settings,
  BarChart3,
  Shield,
  Trophy,
} from "lucide-react";
import React from "react";
import {
  getRolesApi,
  createRoleApi,
  updateRoleApi,
  deleteRoleApi,
  getPermissionCatalogApi,
  RoleItem,
  PermissionGroup,
} from "@/lib/api";
import { getAdminToken } from "@/lib/adminAuth";
import { cn } from "@/lib/utils";

const token = () => getAdminToken() || "";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  users: Users,
  heart: Heart,
  wallet: Wallet,
  network: Network,
  megaphone: Megaphone,
  briefcase: Briefcase,
  settings: Settings,
  shield: Shield,
  "bar-chart": BarChart3,
};

export default function AdminRoles() {
  const [roles, setRoles] = React.useState<RoleItem[]>([]);
  const [groups, setGroups] = React.useState<PermissionGroup[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [draft, setDraft] = React.useState<{
    name: string;
    description: string;
    permissions: Set<string>;
  }>({ name: "", description: "", permissions: new Set() });
  const [dirty, setDirty] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [createForm, setCreateForm] = React.useState({
    name: "",
    description: "",
    cloneFromId: "" as string,
  });

  const [confirmDelete, setConfirmDelete] = React.useState<RoleItem | null>(null);

  const active = roles.find((r) => r._id === activeId) || null;

  async function load() {
    setLoading(true);
    try {
      const [rs, gs] = await Promise.all([getRolesApi(token()), getPermissionCatalogApi(token())]);
      setRoles(rs || []);
      setGroups(gs || []);
      if (!activeId && (rs || []).length) setActiveId(rs[0]._id);
    } catch {
      toast({ title: "Tải dữ liệu thất bại", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
  }, []);

  React.useEffect(() => {
    if (!active) return;
    setDraft({
      name: active.name,
      description: active.description || "",
      permissions: new Set(active.permissions || []),
    });
    setDirty(false);
  }, [activeId, roles.length]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.slug.toLowerCase().includes(q) ||
        (r.description || "").toLowerCase().includes(q),
    );
  }, [roles, search]);

  function togglePerm(key: string) {
    if (active?.isSystem) return;
    setDraft((d) => {
      const next = new Set(d.permissions);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return { ...d, permissions: next };
    });
    setDirty(true);
  }

  function toggleGroup(group: PermissionGroup, value: boolean) {
    if (active?.isSystem) return;
    setDraft((d) => {
      const next = new Set(d.permissions);
      for (const p of group.perms) {
        if (value) next.add(p.key);
        else next.delete(p.key);
      }
      return { ...d, permissions: next };
    });
    setDirty(true);
  }

  async function handleSave() {
    if (!active || active.isSystem) return;
    setSaving(true);
    try {
      const updated = await updateRoleApi(
        active._id,
        {
          name: draft.name,
          description: draft.description,
          permissions: Array.from(draft.permissions),
        },
        token(),
      );
      toast({ title: "Đã lưu vai trò" });
      setRoles((rs) => rs.map((r) => (r._id === updated._id ? updated : r)));
      setDirty(false);
    } catch (e) {
      toast({ title: (e as Error).message || "Lưu thất bại", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleCreate() {
    if (!createForm.name.trim()) {
      toast({ title: "Vui lòng nhập tên vai trò", variant: "destructive" });
      return;
    }
    try {
      const created = await createRoleApi(
        {
          name: createForm.name.trim(),
          description: createForm.description,
          cloneFromId: createForm.cloneFromId || undefined,
        },
        token(),
      );
      toast({ title: "Đã tạo vai trò" });
      setCreateOpen(false);
      setCreateForm({ name: "", description: "", cloneFromId: "" });
      setRoles((rs) => [...rs, created]);
      setActiveId(created._id);
    } catch (e) {
      toast({ title: (e as Error).message || "Tạo thất bại", variant: "destructive" });
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    try {
      await deleteRoleApi(confirmDelete._id, token());
      toast({ title: "Đã xóa vai trò" });
      const remaining = roles.filter((r) => r._id !== confirmDelete._id);
      setRoles(remaining);
      if (activeId === confirmDelete._id) setActiveId(remaining[0]?._id || null);
      setConfirmDelete(null);
    } catch (e) {
      toast({ title: (e as Error).message || "Xóa thất bại", variant: "destructive" });
    }
  }

  const totalPerms = groups.reduce((acc, g) => acc + g.perms.length, 0);
  const checkedCount = draft.permissions.size;

  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold md:text-xl italic">Phân quyền hệ thống</h1>
          </div>

          <Tabs value="roles" className="w-full">
            <TabsList className="h-auto w-full justify-start gap-2 bg-transparent p-0 flex-wrap">
              <TabsTrigger
                value="users"
                asChild
                className="h-9 gap-2 border px-4"
              >
                <Link to="/users">
                  <Users size={14} /> Danh sách người chơi
                </Link>
              </TabsTrigger>
              <TabsTrigger
                value="kyc"
                asChild
                className="h-9 gap-2 border px-4"
              >
                <Link to="/kyc">
                  <ShieldCheck size={14} /> KYC
                </Link>
              </TabsTrigger>
              <TabsTrigger
                value="agents"
                asChild
                className="h-9 gap-2 border px-4"
              >
                <Link to="/agents">
                  <Network size={14} /> Danh sách đại lý
                </Link>
              </TabsTrigger>
              <TabsTrigger
                value="vip"
                asChild
                className="h-9 gap-2 border px-4"
              >
                <Link to="/vip">
                  <Trophy size={14} /> Danh sách VIP
                </Link>
              </TabsTrigger>
              <TabsTrigger
                value="admins"
                asChild
                className="h-9 gap-2 border px-4"
              >
                <Link to="/admin/admins">
                  <Shield size={14} /> Danh sách nhân viên
                </Link>
              </TabsTrigger>
              <TabsTrigger
                value="roles"
                asChild
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-9 gap-2 border px-4"
              >
                <Link to="/admin/roles">
                  <Lock size={14} /> Phân quyền (IAM)
                </Link>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 -mx-2 -my-2">
          {/* Sidebar danh sách roles */}
          <aside className="lg:w-72 lg:shrink-0 border bg-background rounded-lg flex flex-col">
            <div className="p-3 border-b space-y-2">
              <Button
                className="w-full"
                onClick={() => setCreateOpen(true)}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" /> Tạo vai trò
              </Button>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm vai trò..."
                  className="pl-7 h-8 text-xs"
                />
              </div>
            </div>
            <ScrollArea className="flex-1 max-h-[70vh]">
              <div className="p-2 space-y-1">
                {loading && (
                  <div className="text-xs text-muted-foreground p-2">Đang tải...</div>
                )}
                {!loading && filtered.length === 0 && (
                  <div className="text-xs text-muted-foreground p-2">Không có vai trò</div>
                )}
                {filtered.map((r) => (
                  <button
                    key={r._id}
                    onClick={() => setActiveId(r._id)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md flex items-center gap-2 text-sm transition-colors",
                      activeId === r._id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted",
                    )}
                  >
                    <ShieldCheck className="h-4 w-4 shrink-0 opacity-70" />
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium">{r.name}</div>
                      <div
                        className={cn(
                          "text-[10px] truncate",
                          activeId === r._id ? "opacity-80" : "text-muted-foreground",
                        )}
                      >
                        {r.permissions.length} quyền
                      </div>
                    </div>
                    {r.isSystem && <Lock className="h-3 w-3 opacity-60" />}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </aside>

          {/* Detail phải */}
          <main className="flex-1 min-w-0 space-y-4">
            {!active ? (
              <div className="border rounded-lg p-12 text-center text-muted-foreground">
                Chọn một vai trò để xem chi tiết
              </div>
            ) : (
              <>
                <div className="border rounded-lg bg-background p-4">
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold truncate">{active.name}</h1>
                        {active.isSystem && (
                          <Badge variant="secondary" className="gap-1">
                            <Lock className="h-3 w-3" /> System
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[10px]">
                          {checkedCount}/{totalPerms} quyền
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        slug: <code className="font-mono">{active.slug}</code>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCreateForm({
                            name: `${active.name} (copy)`,
                            description: active.description || "",
                            cloneFromId: active._id,
                          });
                          setCreateOpen(true);
                        }}
                      >
                        <Copy className="h-3.5 w-3.5 mr-1" /> Clone
                      </Button>
                      {!active.isSystem && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setConfirmDelete(active)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Xóa
                        </Button>
                      )}
                    </div>
                  </div>

                  {active.isSystem && (
                    <div className="mt-3 flex items-start gap-2 text-xs bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 rounded p-2">
                      <Info className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>
                        Đây là vai trò hệ thống — không thể chỉnh sửa hoặc xóa. Bạn có
                        thể nhấn <b>Clone</b> để tạo một bản sao có thể chỉnh sửa.
                      </span>
                    </div>
                  )}

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Tên vai trò</label>
                      <Input
                        value={draft.name}
                        disabled={active.isSystem}
                        onChange={(e) => {
                          setDraft({ ...draft, name: e.target.value });
                          setDirty(true);
                        }}
                      />
                    </div>
                    <div className="space-y-1 md:row-span-2">
                      <label className="text-xs font-medium">Mô tả</label>
                      <Textarea
                        rows={4}
                        value={draft.description}
                        disabled={active.isSystem}
                        onChange={(e) => {
                          setDraft({ ...draft, description: e.target.value });
                          setDirty(true);
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Quyền theo nhóm */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {groups.map((g) => {
                    const Icon = ICONS[g.icon || ""] || ShieldCheck;
                    const total = g.perms.length;
                    const sel = g.perms.filter((p) => draft.permissions.has(p.key)).length;
                    const allChecked = sel === total;
                    const someChecked = sel > 0 && sel < total;
                    return (
                      <div key={g.key} className="border rounded-lg bg-background">
                        <div className="px-3 py-2 border-b flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <div className="text-sm font-medium">{g.label}</div>
                            <Badge
                              variant={
                                allChecked ? "default" : someChecked ? "secondary" : "outline"
                              }
                              className="text-[10px]"
                            >
                              {sel}/{total}
                            </Badge>
                          </div>
                          <Checkbox
                            disabled={active.isSystem}
                            checked={allChecked || (someChecked ? "indeterminate" : false)}
                            onCheckedChange={(v) => toggleGroup(g, !!v)}
                          />
                        </div>
                        <div className="p-2 space-y-1">
                          {g.perms.map((p) => (
                            <label
                              key={p.key}
                              className={cn(
                                "flex items-start gap-2 p-2 rounded-md text-sm",
                                active.isSystem
                                  ? "cursor-default opacity-70"
                                  : "cursor-pointer hover:bg-muted",
                              )}
                            >
                              <Checkbox
                                checked={draft.permissions.has(p.key)}
                                disabled={active.isSystem}
                                onCheckedChange={() => togglePerm(p.key)}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm leading-tight">{p.label}</div>
                                <code className="text-[10px] text-muted-foreground font-mono">
                                  {p.key}
                                </code>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Sticky save */}
                {!active.isSystem && (
                  <div
                    className={cn(
                      "sticky bottom-2 z-10 border rounded-lg bg-background/95 backdrop-blur p-3 flex items-center gap-3 transition-opacity",
                      dirty ? "opacity-100" : "opacity-60",
                    )}
                  >
                    <div className="text-xs text-muted-foreground flex-1">
                      {dirty ? "Bạn có thay đổi chưa lưu." : "Không có thay đổi."}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!dirty}
                      onClick={() => {
                        setDraft({
                          name: active.name,
                          description: active.description || "",
                          permissions: new Set(active.permissions || []),
                        });
                        setDirty(false);
                      }}
                    >
                      Hủy
                    </Button>
                    <Button size="sm" disabled={!dirty || saving} onClick={handleSave}>
                      <Save className="h-3.5 w-3.5 mr-1" />
                      {saving ? "Đang lưu..." : "Lưu thay đổi"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>

        {/* Dialog tạo role */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo vai trò mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Tên vai trò</label>
                <Input
                  placeholder="VD: CSKH cấp 1"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Mô tả</label>
                <Textarea
                  rows={3}
                  placeholder="Mô tả ngắn gọn nhiệm vụ của vai trò này"
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, description: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Sao chép quyền từ (tuỳ chọn)</label>
                <select
                  className="w-full border rounded-md px-2 py-2 text-sm bg-background"
                  value={createForm.cloneFromId}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, cloneFromId: e.target.value })
                  }
                >
                  <option value="">— Không sao chép (bắt đầu rỗng) —</option>
                  {roles.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name} ({r.permissions.length} quyền)
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleCreate}>Tạo</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirm delete */}
        <AlertDialog open={!!confirmDelete} onOpenChange={(v) => !v && setConfirmDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xóa vai trò "{confirmDelete?.name}"?</AlertDialogTitle>
              <AlertDialogDescription>
                Người dùng đang được gán vai trò này sẽ mất các quyền tương ứng. Hành động này
                không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Xóa
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AdminLayout>
    </RequireSuperAdmin>
  );
}
