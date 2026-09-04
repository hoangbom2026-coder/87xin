import * as React from "react";
import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Button } from "@game/ui/button";
import { Input } from "@game/ui/input";
import { Label } from "@game/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@game/ui/dialog";
import { Textarea } from "@game/ui/textarea";
import { toast } from "@game/ui/use-toast";
import {
  listSitePlugins,
  patchSitePlugin,
  installSitePlugin,
  uninstallSitePlugin,
  createSitePlugin,
} from "@/lib/api";
import { getAdminToken } from "@/lib/adminAuth";
import { Link } from "react-router-dom";
import {
  Download,
  Puzzle,
  RefreshCw,
  Search,
  Settings,
  Plus,
} from "lucide-react";

const token = () => getAdminToken() || "";

type PluginRow = {
  _id: string;
  key: string;
  title: string;
  version: string;
  description: string;
  author: string;
  iconUrl: string;
  status: "installed" | "available" | "disabled";
  configPath?: string;
  configJson?: Record<string, unknown>;
};

export default function PluginsPage() {
  const [q, setQ] = React.useState("");
  const [rows, setRows] = React.useState<PluginRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [cfgOpen, setCfgOpen] = React.useState(false);
  const [cfgRow, setCfgRow] = React.useState<PluginRow | null>(null);
  const [cfgText, setCfgText] = React.useState("{}");
  const [addOpen, setAddOpen] = React.useState(false);
  const [newPl, setNewPl] = React.useState({
    key: "",
    title: "",
    version: "1.0.0",
    description: "",
    author: "",
  });

  const load = React.useCallback(async () => {
    const t = token();
    if (!t) return;
    setLoading(true);
    try {
      const res = await listSitePlugins(t, q.trim() || undefined);
      setRows(((res as any)?.items as PluginRow[]) || []);
    } catch (e: any) {
      toast({
        title: "Không tải được danh sách",
        description: e?.message || "",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [q]);

  React.useEffect(() => {
    const id = window.setTimeout(load, 280);
    return () => window.clearTimeout(id);
  }, [load]);

  function openConfig(row: PluginRow) {
    setCfgRow(row);
    setCfgText(JSON.stringify(row.configJson || {}, null, 2));
    setCfgOpen(true);
  }

  async function saveConfig() {
    if (!cfgRow) return;
    const t = token();
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(cfgText);
      if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("configJson phải là object JSON");
      }
    } catch (e: any) {
      toast({
        title: "JSON không hợp lệ",
        description: e?.message || "",
        variant: "destructive",
      });
      return;
    }
    setBusyId(cfgRow._id);
    try {
      await patchSitePlugin(cfgRow._id, { configJson: parsed }, t);
      toast({ title: "Đã lưu cấu hình" });
      setCfgOpen(false);
      await load();
    } catch (e: any) {
      toast({
        title: "Lưu thất bại",
        description: e?.message || "",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function doInstall(id: string) {
    setBusyId(id);
    try {
      await installSitePlugin(id, token());
      toast({ title: "Đã cài đặt" });
      await load();
    } catch (e: any) {
      toast({
        title: "Lỗi",
        description: e?.message || "",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function doUninstall(id: string) {
    setBusyId(id);
    try {
      await uninstallSitePlugin(id, token());
      toast({ title: "Đã gỡ (trạng thái: available)" });
      await load();
    } catch (e: any) {
      toast({
        title: "Lỗi",
        description: e?.message || "",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function submitNew() {
    const t = token();
    if (!newPl.key.trim() || !newPl.title.trim()) {
      toast({
        title: "Thiếu key hoặc tiêu đề",
        variant: "destructive",
      });
      return;
    }
    try {
      await createSitePlugin(
        {
          key: newPl.key.trim(),
          title: newPl.title.trim(),
          version: newPl.version.trim() || "1.0.0",
          description: newPl.description,
          author: newPl.author,
          status: "available",
        },
        t,
      );
      toast({ title: "Đã thêm plugin" });
      setAddOpen(false);
      setNewPl({
        key: "",
        title: "",
        version: "1.0.0",
        description: "",
        author: "",
      });
      await load();
    } catch (e: any) {
      toast({
        title: "Không tạo được",
        description: e?.message || "",
        variant: "destructive",
      });
    }
  }

  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <AdminPageHeader
          title="Plugins"
          description="Module / tiện ích đăng ký trong MongoDB — trạng thái & JSON cấu hình."
          actions={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                <RefreshCw className="mr-1 size-4" />
                Làm mới
              </Button>
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <Plus className="mr-1 size-4" />
                Thêm plugin
              </Button>
            </div>
          }
        />

        <div className="relative mt-4 max-w-xl">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Tìm theo tên, key, mô tả, tác giả…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="searchResults animate-sm mt-6 flex flex-wrap items-stretch justify-start gap-0 p-0">
          {rows.map((p) => (
            <div
              key={p._id}
              className="searchResult box-border w-full p-[10px] sm:w-1/2 lg:w-1/3"
            >
              <div
                className="searchResultContent flex h-full min-h-[420px] flex-col rounded-[20px] bg-[#1c1b20] p-5 text-white shadow-sm"
                style={{ boxSizing: "border-box" }}
              >
                <div className="mb-3 flex justify-center">
                  {p.iconUrl ? (
                    <img
                      src={p.iconUrl}
                      alt={p.title}
                      width={85}
                      height={85}
                      className="object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <span className="flex size-[85px] items-center justify-center rounded-2xl bg-white/10">
                      <Puzzle className="size-12 text-white/90" />
                    </span>
                  )}
                </div>
                <div className="title text-center text-lg font-semibold leading-snug">
                  {p.title}
                </div>
                <div className="version mt-1 text-center text-sm text-white/60">
                  {p.version}
                </div>
                <div className="description mt-3 flex-1 text-center text-sm leading-relaxed text-white/75">
                  {p.description}
                </div>
                <div className="author mt-3 text-center text-xs text-white/50">
                  @ {p.author}
                </div>
                <div className="mt-2 text-center text-xs uppercase tracking-wide text-white/40">
                  {p.status}
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {p.configPath ? (
                    <Button
                      asChild
                      size="sm"
                      className="bg-primary text-primary-foreground"
                    >
                      <Link to={p.configPath.startsWith("/") ? p.configPath : `/${p.configPath}`}>
                        <Settings className="mr-1 size-4" />
                        Mở cấu hình
                      </Link>
                    </Button>
                  ) : null}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openConfig(p)}
                    disabled={busyId === p._id}
                  >
                    <Settings className="mr-1 size-4" />
                    JSON
                  </Button>
                  {p.status !== "installed" ? (
                    <Button
                      size="sm"
                      variant="default"
                      disabled={busyId === p._id}
                      onClick={() => doInstall(p._id)}
                    >
                      <Download className="mr-1 size-4" />
                      Cài đặt
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/20 bg-transparent text-white hover:bg-white/10"
                      disabled={busyId === p._id}
                      onClick={() => doUninstall(p._id)}
                    >
                      Gỡ
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {!rows.length && !loading ? (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Không có plugin nào. Khởi động backend sẽ seed mặc định (nếu collection trống).
          </p>
        ) : null}

        <Dialog open={cfgOpen} onOpenChange={setCfgOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Cấu hình JSON — {cfgRow?.title}</DialogTitle>
            </DialogHeader>
            <Textarea
              rows={12}
              className="font-mono text-xs"
              value={cfgText}
              onChange={(e) => setCfgText(e.target.value)}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setCfgOpen(false)}>
                Hủy
              </Button>
              <Button onClick={saveConfig} disabled={busyId !== null}>
                Lưu
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm plugin</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="grid gap-1">
                <Label>Key (duy nhất)</Label>
                <Input
                  value={newPl.key}
                  onChange={(e) =>
                    setNewPl((s) => ({ ...s, key: e.target.value }))
                  }
                  placeholder="myPlugin"
                />
              </div>
              <div className="grid gap-1">
                <Label>Tiêu đề</Label>
                <Input
                  value={newPl.title}
                  onChange={(e) =>
                    setNewPl((s) => ({ ...s, title: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-1">
                <Label>Phiên bản</Label>
                <Input
                  value={newPl.version}
                  onChange={(e) =>
                    setNewPl((s) => ({ ...s, version: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-1">
                <Label>Mô tả</Label>
                <Textarea
                  rows={3}
                  value={newPl.description}
                  onChange={(e) =>
                    setNewPl((s) => ({ ...s, description: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-1">
                <Label>Tác giả</Label>
                <Input
                  value={newPl.author}
                  onChange={(e) =>
                    setNewPl((s) => ({ ...s, author: e.target.value }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                Hủy
              </Button>
              <Button onClick={submitNew}>Tạo</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </RequireSuperAdmin>
  );
}
