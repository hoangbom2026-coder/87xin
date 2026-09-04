import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@game/ui/card";
import { Button } from "@game/ui/button";
import { Input } from "@game/ui/input";
import { Textarea } from "@game/ui/textarea";
import { Switch } from "@game/ui/switch";
import { Badge } from "@game/ui/badge";
import { Checkbox } from "@game/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@game/ui/sheet";
import { ScrollArea } from "@game/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  Search,
  RefreshCw,
  Star,
  Eye,
  EyeOff,
  Wrench,
  Zap,
  Trash2,
  Heart,
  Sparkles,
  Gauge,
  Settings,
  Plus,
  Save,
} from "lucide-react";
import * as React from "react";
import { useSearchParams } from "react-router-dom";
import {
  getGameCountsApi,
  getGameCatalogApi,
  listGamesApi,
  updateGameApi,
  bulkPatchGameFlagsApi,
  createGameApi,
  deleteGameApi,
  GameCategoryMeta,
  GameItem,
} from "@/lib/api";
import { getAdminToken } from "@/lib/adminAuth";
import { cn } from "@/lib/utils";

const tk = () => getAdminToken() || "";
const fmt = new Intl.NumberFormat("vi-VN");

export default function GamesHub() {
  const [params, setParams] = useSearchParams();
  const [catalog, setCatalog] = React.useState<{ categories: { key: string; label: string }[]; kinds: string[] }>({
    categories: [],
    kinds: [],
  });
  const [counts, setCounts] = React.useState<GameCategoryMeta[]>([]);
  const category = params.get("category") || "originals";
  const kind = params.get("kind") || "all";
  const setCategory = (v: string) => {
    const next = new URLSearchParams(params);
    next.set("category", v);
    next.delete("kind");
    setParams(next, { replace: true });
  };
  const setKind = (v: string) => {
    const next = new URLSearchParams(params);
    if (v === "all") next.delete("kind");
    else next.set("kind", v);
    setParams(next, { replace: true });
  };
  const [q, setQ] = React.useState("");
  const [enabledFilter, setEnabledFilter] = React.useState<"all" | "enabled" | "disabled">("all");
  const [items, setItems] = React.useState<GameItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [active, setActive] = React.useState<GameItem | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [confirmDel, setConfirmDel] = React.useState<GameItem | null>(null);

  async function refreshCounts() {
    try {
      const r = await getGameCountsApi(tk());
      setCounts(r.categories);
    } catch {
      /* ignore */
    }
  }

  async function loadCatalog() {
    try {
      const c = await getGameCatalogApi(tk());
      setCatalog(c);
    } catch {
      /* ignore */
    }
  }

  async function load() {
    setLoading(true);
    try {
      const r = await listGamesApi(
        { category, kind, q, enabled: enabledFilter, limit: 200 },
        tk(),
      );
      setItems(r.items);
      setTotal(r.total);
    } catch (e) {
      toast({ title: (e as Error).message || "Tải thất bại", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    loadCatalog();
    refreshCounts();
  }, []);
  React.useEffect(() => {
    load();
  }, [category, kind, enabledFilter]);

  async function patchFlag(g: GameItem, flag: keyof GameItem, value: boolean) {
    const optimistic = items.map((x) => (x._id === g._id ? { ...x, [flag]: value } : x));
    setItems(optimistic);
    try {
      const r = await updateGameApi(g._id, { [flag]: value } as Partial<GameItem>, tk());
      setItems((xs) => xs.map((x) => (x._id === r._id ? r : x)));
      refreshCounts();
    } catch (e) {
      load();
      toast({ title: (e as Error).message || "Lưu thất bại", variant: "destructive" });
    }
  }

  function toggleSelect(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function selectAll() {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map((i) => i._id)));
  }

  async function bulkApply(flags: Record<string, boolean>) {
    if (!selected.size) return;
    try {
      await bulkPatchGameFlagsApi(Array.from(selected), flags, tk());
      toast({ title: `Đã cập nhật ${selected.size} game` });
      setSelected(new Set());
      load();
      refreshCounts();
    } catch (e) {
      toast({ title: (e as Error).message || "Bulk thất bại", variant: "destructive" });
    }
  }

  function resetSelection() {
    setSelected(new Set());
  }

  async function handleDelete() {
    if (!confirmDel) return;
    try {
      await deleteGameApi(confirmDel._id, tk());
      toast({ title: "Đã xóa game" });
      setConfirmDel(null);
      if (active?._id === confirmDel._id) setActive(null);
      load();
      refreshCounts();
    } catch (e) {
      toast({ title: (e as Error).message || "Xóa thất bại", variant: "destructive" });
    }
  }

  const cat = counts.find((c) => c.key === category);
  const kindsForCat = cat
    ? Object.entries(cat.kinds || {}).sort((a, b) => b[1].count - a[1].count)
    : [];

  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <div className="flex flex-col lg:flex-row gap-3 -mx-2 -my-2">
          {/* Sidebar Categories */}
          <aside className="lg:w-56 lg:shrink-0 border bg-background rounded-lg flex flex-col">
            <div className="p-3 border-b text-xs font-semibold uppercase text-muted-foreground">
              Categories
            </div>
            <ScrollArea className="flex-1 max-h-[70vh]">
              <div className="p-2 space-y-1">
                {counts.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => {
                      setCategory(c.key);
                      resetSelection();
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between gap-2 transition-colors",
                      category === c.key
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted",
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: c.color || "#888" }}
                      />
                      <span className="truncate">{c.label}</span>
                    </div>
                    <Badge
                      variant={category === c.key ? "secondary" : "outline"}
                      className="text-[10px]"
                    >
                      {fmt.format(c.count)}
                    </Badge>
                  </button>
                ))}
                {counts.length === 0 && (
                  <div className="text-xs text-muted-foreground px-3 py-2">
                    Đang tải...
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="p-2 border-t">
              <Button size="sm" className="w-full" onClick={() => setCreateOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Thêm game
              </Button>
            </div>
          </aside>

          {/* Main */}
          <main className="flex-1 min-w-0 space-y-3">
            {/* Header */}
            <div className="border rounded-lg bg-background p-3 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-bold">
                  {cat?.label ?? "Games"}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    {fmt.format(total)} game · {fmt.format(cat?.enabled ?? 0)} bật ·{" "}
                    {fmt.format(cat?.visible ?? 0)} hiển thị
                  </span>
                </h1>
                <div className="flex-1" />
                <Button variant="outline" size="sm" onClick={() => { load(); refreshCounts(); }} disabled={loading}>
                  <RefreshCw className="h-3.5 w-3.5 mr-1" /> Làm mới
                </Button>
                <Button variant="outline" size="sm" onClick={resetSelection}>
                  Reset
                </Button>
              </div>

              {/* Search & filter status */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && load()}
                    placeholder="Tìm theo tên / key / tag..."
                    className="pl-7 h-9"
                  />
                </div>
                <div className="flex items-center gap-1">
                  {(["all", "enabled", "disabled"] as const).map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={enabledFilter === s ? "default" : "outline"}
                      onClick={() => setEnabledFilter(s)}
                    >
                      {s === "all" ? "Tất cả" : s === "enabled" ? "Đang bật" : "Đang tắt"}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Kind pills */}
              <div className="flex flex-wrap gap-1 pt-1">
                <Button
                  size="sm"
                  variant={kind === "all" ? "default" : "outline"}
                  onClick={() => setKind("all")}
                  className="h-7"
                >
                  Tất cả ({fmt.format(cat?.count ?? 0)})
                </Button>
                {kindsForCat.map(([k, b]) => (
                  <Button
                    key={k}
                    size="sm"
                    variant={kind === k ? "default" : "outline"}
                    onClick={() => setKind(k)}
                    className="h-7 capitalize"
                  >
                    {k} ({fmt.format(b.count)})
                  </Button>
                ))}
                {catalog.kinds
                  .filter((k) => !kindsForCat.find(([kk]) => kk === k))
                  .filter((k) => k !== "other")
                  .slice(0, 6)
                  .map((k) => (
                    <Button
                      key={k}
                      size="sm"
                      variant="ghost"
                      onClick={() => setKind(k)}
                      className="h-7 capitalize text-muted-foreground"
                    >
                      {k} (0)
                    </Button>
                  ))}
              </div>
            </div>

            {/* Bulk action bar */}
            {selected.size > 0 && (
              <div className="sticky top-2 z-10 border rounded-lg bg-background/95 backdrop-blur p-2 flex flex-wrap items-center gap-2 text-xs shadow-sm">
                <span className="font-medium">Đã chọn {selected.size}</span>
                <Button size="sm" variant="outline" onClick={() => bulkApply({ enabled: true })}>
                  <Zap className="h-3 w-3 mr-1" /> Bật
                </Button>
                <Button size="sm" variant="outline" onClick={() => bulkApply({ enabled: false })}>
                  Tắt
                </Button>
                <Button size="sm" variant="outline" onClick={() => bulkApply({ visible: true })}>
                  <Eye className="h-3 w-3 mr-1" /> Hiện
                </Button>
                <Button size="sm" variant="outline" onClick={() => bulkApply({ visible: false })}>
                  <EyeOff className="h-3 w-3 mr-1" /> Ẩn
                </Button>
                <Button size="sm" variant="outline" onClick={() => bulkApply({ featured: true })}>
                  <Star className="h-3 w-3 mr-1" /> Featured
                </Button>
                <Button size="sm" variant="outline" onClick={() => bulkApply({ maintenance: true })}>
                  <Wrench className="h-3 w-3 mr-1" /> Bảo trì
                </Button>
                <Button size="sm" variant="ghost" onClick={resetSelection}>
                  Bỏ chọn
                </Button>
              </div>
            )}

            {/* Games grid */}
            <div className="border rounded-lg bg-background">
              <div className="px-3 py-2 border-b flex items-center gap-2 text-xs">
                <Checkbox
                  checked={items.length > 0 && selected.size === items.length}
                  onCheckedChange={selectAll}
                />
                <span className="text-muted-foreground">
                  {selected.size > 0 ? `Đã chọn ${selected.size}/${items.length}` : "Chọn tất cả"}
                </span>
              </div>
              {loading ? (
                <div className="p-8 text-center text-sm text-muted-foreground">Đang tải...</div>
              ) : items.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Không có game nào
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 p-2">
                  {items.map((g) => (
                    <GameCard
                      key={g._id}
                      g={g}
                      selected={selected.has(g._id)}
                      onSelect={() => toggleSelect(g._id)}
                      onOpen={() => setActive(g)}
                      onPatch={(flag, v) => patchFlag(g, flag, v)}
                    />
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>

        {/* Drawer chi tiết */}
        <GameDetailSheet
          game={active}
          onClose={() => setActive(null)}
          onSaved={(g) => {
            setItems((xs) => xs.map((x) => (x._id === g._id ? g : x)));
            setActive(g);
            refreshCounts();
          }}
          onDelete={(g) => setConfirmDel(g)}
        />

        {/* Dialog tạo */}
        <CreateGameDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          defaultCategory={category}
          onCreated={() => { load(); refreshCounts(); }}
        />

        {/* Confirm delete */}
        <AlertDialog open={!!confirmDel} onOpenChange={(v) => !v && setConfirmDel(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xóa "{confirmDel?.name}"?</AlertDialogTitle>
              <AlertDialogDescription>
                Hành động không thể hoàn tác. Game sẽ bị gỡ khỏi danh sách public ngay lập tức.
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

function GameCard({
  g,
  selected,
  onSelect,
  onOpen,
  onPatch,
}: {
  g: GameItem;
  selected: boolean;
  onSelect: () => void;
  onOpen: () => void;
  onPatch: (flag: keyof GameItem, v: boolean) => void;
}) {
  return (
    <div
      className={cn(
        "border rounded-md group relative overflow-hidden transition-all",
        selected && "ring-2 ring-primary",
        !g.enabled && "opacity-60",
      )}
    >
      <div className="absolute top-1 left-1 z-10">
        <Checkbox checked={selected} onCheckedChange={onSelect} />
      </div>
      {g.maintenance && (
        <div className="absolute top-1 right-1 z-10">
          <Badge className="bg-amber-500 hover:bg-amber-500 text-white text-[9px]">
            <Wrench className="h-2.5 w-2.5 mr-1" /> Bảo trì
          </Badge>
        </div>
      )}
      <button
        type="button"
        className="block w-full aspect-[4/3] bg-muted overflow-hidden"
        onClick={onOpen}
      >
        {g.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={g.image} alt={g.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full grid place-items-center text-muted-foreground">
            <Sparkles className="h-8 w-8 opacity-40" />
          </div>
        )}
      </button>
      <div className="p-2 space-y-1">
        <div className="flex items-start justify-between gap-1">
          <button
            type="button"
            className="text-left text-sm font-medium truncate hover:underline"
            onClick={onOpen}
          >
            {g.name}
          </button>
          {g.featured && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Badge variant="outline" className="text-[9px] capitalize">
            {g.kind}
          </Badge>
          <span>·</span>
          <span className="truncate">{g.gameKey}</span>
        </div>
        <div className="grid grid-cols-2 gap-1 text-[10px] pt-1">
          <FlagToggle label="Enabled" icon={Zap} checked={g.enabled} onChange={(v) => onPatch("enabled", v)} />
          <FlagToggle label="Visible" icon={Eye} checked={g.visible} onChange={(v) => onPatch("visible", v)} />
          <FlagToggle label="Featured" icon={Star} checked={g.featured} onChange={(v) => onPatch("featured", v)} />
          <FlagToggle label="Search" icon={Search} checked={g.searchable} onChange={(v) => onPatch("searchable", v)} />
        </div>
      </div>
    </div>
  );
}

function FlagToggle({
  label,
  icon: Icon,
  checked,
  onChange,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      className={cn(
        "flex items-center gap-1 px-1.5 py-1 rounded cursor-pointer border",
        checked ? "border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/30" : "border-muted bg-muted/30",
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <Switch className="scale-75" checked={checked} onCheckedChange={onChange} />
      <Icon className={cn("h-3 w-3", checked ? "text-emerald-600" : "text-muted-foreground")} />
      <span className={cn("truncate text-[10px]", checked ? "" : "text-muted-foreground")}>
        {label}
      </span>
    </label>
  );
}

function GameDetailSheet({
  game,
  onClose,
  onSaved,
  onDelete,
}: {
  game: GameItem | null;
  onClose: () => void;
  onSaved: (g: GameItem) => void;
  onDelete: (g: GameItem) => void;
}) {
  const [draft, setDraft] = React.useState<GameItem | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setDraft(game ? structuredClone(game) : null);
  }, [game?._id]);

  if (!game || !draft) return null;

  const setField = <K extends keyof GameItem>(k: K, v: GameItem[K]) =>
    setDraft((d) => (d ? { ...d, [k]: v } : d));
  const setRng = <K extends keyof GameItem["rngOverride"]>(k: K, v: GameItem["rngOverride"][K]) =>
    setDraft((d) => (d ? { ...d, rngOverride: { ...d.rngOverride, [k]: v } } : d));

  async function save() {
    if (!draft) return;
    setSaving(true);
    try {
      const r = await updateGameApi(
        draft._id,
        {
          name: draft.name,
          image: draft.image,
          description: draft.description,
          category: draft.category,
          kind: draft.kind,
          provider: draft.provider,
          externalCode: draft.externalCode,
          tags: draft.tags,
          enabled: draft.enabled,
          visible: draft.visible,
          featured: draft.featured,
          favorite: draft.favorite,
          searchable: draft.searchable,
          maintenance: draft.maintenance,
          order: draft.order,
          rngOverride: draft.rngOverride,
        },
        tk(),
      );
      toast({ title: "Đã lưu" });
      onSaved(r);
    } catch (e) {
      toast({ title: (e as Error).message || "Lưu thất bại", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={!!game} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {draft.name}
            {draft.maintenance && (
              <Badge className="bg-amber-500 hover:bg-amber-500 text-white text-[10px]">
                <Wrench className="h-3 w-3 mr-1" /> Bảo trì
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            <code className="text-[10px] font-mono">{draft.gameKey}</code> ·{" "}
            <span className="capitalize">{draft.category}</span> ·{" "}
            <span className="capitalize">{draft.kind}</span>
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          {/* Flags chính */}
          <Card>
            <CardContent className="p-3 space-y-2">
              <div className="text-xs font-semibold uppercase text-muted-foreground">
                Trạng thái hiển thị
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ["enabled", "Enabled", Zap],
                    ["visible", "Visible", Eye],
                    ["featured", "Featured", Star],
                    ["favorite", "Favorite", Heart],
                    ["searchable", "Searchable", Search],
                    ["maintenance", "Maintenance", Wrench],
                  ] as const
                ).map(([key, label, Icon]) => (
                  <label
                    key={key}
                    className="flex items-center justify-between p-2 border rounded-md cursor-pointer"
                  >
                    <span className="text-sm flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      {label}
                    </span>
                    <Switch
                      checked={!!draft[key]}
                      onCheckedChange={(v) => setField(key, v as never)}
                    />
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Thông tin */}
          <Card>
            <CardContent className="p-3 space-y-2">
              <div className="text-xs font-semibold uppercase text-muted-foreground">
                Thông tin
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1 col-span-2">
                  <label className="text-xs">Tên hiển thị</label>
                  <Input value={draft.name} onChange={(e) => setField("name", e.target.value)} />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-xs">Image URL</label>
                  <Input value={draft.image || ""} onChange={(e) => setField("image", e.target.value)} />
                  {draft.image && (
                    <img
                      src={draft.image}
                      alt=""
                      className="mt-1 h-20 w-32 object-cover rounded border"
                    />
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs">Provider</label>
                  <Input value={draft.provider} onChange={(e) => setField("provider", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs">External Code</label>
                  <Input value={draft.externalCode || ""} onChange={(e) => setField("externalCode", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs">Order</label>
                  <Input
                    type="number"
                    value={draft.order}
                    onChange={(e) => setField("order", Number(e.target.value || 0))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs">Tags (cách bằng dấu phẩy)</label>
                  <Input
                    value={(draft.tags || []).join(",")}
                    onChange={(e) =>
                      setField(
                        "tags",
                        e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      )
                    }
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-xs">Mô tả</label>
                  <Textarea
                    rows={3}
                    value={draft.description || ""}
                    onChange={(e) => setField("description", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RNG override */}
          <Card>
            <CardContent className="p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2">
                    <Gauge className="h-3.5 w-3.5" /> RNG Override
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Mặc định game dùng fair RNG. Bật module bên dưới để ghi đè kết quả / áp giới hạn payout.
                  </p>
                </div>
                <Switch
                  checked={draft.rngOverride.enabled}
                  onCheckedChange={(v) => setRng("enabled", v)}
                />
              </div>

              <div
                className={cn(
                  "grid grid-cols-2 gap-2 transition-opacity",
                  !draft.rngOverride.enabled && "opacity-50 pointer-events-none",
                )}
              >
                <label className="flex items-center justify-between p-2 border rounded-md">
                  <span className="text-sm">Force Lose</span>
                  <Switch
                    checked={draft.rngOverride.forceLose}
                    onCheckedChange={(v) => {
                      setRng("forceLose", v);
                      if (v) setRng("forceWin", false);
                    }}
                  />
                </label>
                <label className="flex items-center justify-between p-2 border rounded-md">
                  <span className="text-sm">Force Win</span>
                  <Switch
                    checked={draft.rngOverride.forceWin}
                    onCheckedChange={(v) => {
                      setRng("forceWin", v);
                      if (v) setRng("forceLose", false);
                    }}
                  />
                </label>
                <div className="space-y-1">
                  <label className="text-xs">Max payout / round (USD)</label>
                  <Input
                    type="number"
                    value={draft.rngOverride.maxPayoutPerRound}
                    onChange={(e) => setRng("maxPayoutPerRound", Number(e.target.value || 0))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs">Max payout / user / day (USD)</label>
                  <Input
                    type="number"
                    value={draft.rngOverride.maxPayoutPerUserDay}
                    onChange={(e) => setRng("maxPayoutPerUserDay", Number(e.target.value || 0))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs">Target RTP %</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={draft.rngOverride.targetRtpPercent}
                    onChange={(e) => setRng("targetRtpPercent", Number(e.target.value || 0))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs">Bias lose %</label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={draft.rngOverride.biasLosePercent}
                    onChange={(e) =>
                      setRng(
                        "biasLosePercent",
                        Math.max(0, Math.min(100, Number(e.target.value || 0))),
                      )
                    }
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-xs">Apply only to user IDs (cách bằng dấu phẩy)</label>
                  <Input
                    value={(draft.rngOverride.appliesToUserIds || []).join(",")}
                    onChange={(e) =>
                      setRng(
                        "appliesToUserIds",
                        e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      )
                    }
                    placeholder="Trống = áp tất cả"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-xs">Notes (admin only)</label>
                  <Textarea
                    rows={2}
                    value={draft.rngOverride.notes}
                    onChange={(e) => setRng("notes", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer actions */}
          <div className="flex justify-between gap-2">
            <Button
              variant="destructive"
              onClick={() => onDelete(draft)}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Xóa game
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Đóng
              </Button>
              <Button onClick={save} disabled={saving}>
                <Save className="h-3.5 w-3.5 mr-1" />
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CreateGameDialog({
  open,
  onOpenChange,
  defaultCategory,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultCategory: string;
  onCreated: () => void;
}) {
  const [form, setForm] = React.useState({
    name: "",
    category: defaultCategory || "originals",
    kind: "other",
    image: "",
    provider: "internal",
    externalCode: "",
  });
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (open) setForm((f) => ({ ...f, category: defaultCategory || "originals" }));
  }, [open, defaultCategory]);

  async function submit() {
    if (!form.name.trim()) {
      toast({ title: "Cần nhập tên game", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      await createGameApi(form, tk());
      toast({ title: "Đã tạo game" });
      onOpenChange(false);
      setForm({ name: "", category: defaultCategory || "originals", kind: "other", image: "", provider: "internal", externalCode: "" });
      onCreated();
    } catch (e) {
      toast({ title: (e as Error).message || "Tạo thất bại", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4" /> Thêm game
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs">Tên game *</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs">Category</label>
              <select
                className="w-full border rounded-md h-9 px-2 text-sm bg-background"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {[
                  "originals",
                  "slots",
                  "live_casino",
                  "table-games",
                  "game-bai",
                  "no-hu",
                  "quay-so",
                  "lo-de",
                  "ban-ca",
                  "da-ga",
                  "sports",
                  "lottery",
                ].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs">Kind</label>
              <select
                className="w-full border rounded-md h-9 px-2 text-sm bg-background"
                value={form.kind}
                onChange={(e) => setForm({ ...form, kind: e.target.value })}
              >
                {[
                  "mines",
                  "dice",
                  "plinko",
                  "slot",
                  "crash",
                  "wheel",
                  "blackjack",
                  "coinflip",
                  "keno",
                  "tower",
                  "stairs",
                  "diamonds",
                  "roulette",
                  "baccarat",
                  "sicbo",
                  "fishing",
                  "other",
                ].map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs">Provider</label>
              <Input value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs">External code</label>
              <Input
                value={form.externalCode}
                onChange={(e) => setForm({ ...form, externalCode: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs">Image URL</label>
            <Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Hủy
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? "Đang tạo..." : "Tạo game"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
