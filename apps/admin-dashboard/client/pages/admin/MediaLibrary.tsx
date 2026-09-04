import AdminLayout from "@/components/layout/AdminLayout";
import { Badge } from "@game/ui/badge";
import { Button } from "@game/ui/button";
import { Card, CardContent } from "@game/ui/card";
import { Input } from "@game/ui/input";
import { Label } from "@game/ui/label";
import { ScrollArea } from "@game/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@game/ui/select";
import { Textarea } from "@game/ui/textarea";
import { toast } from "@game/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  bulkDeleteMediaApi,
  createMediaFolderApi,
  deleteMediaApi,
  deleteMediaFolderApi,
  listMediaApi,
  listMediaFoldersApi,
  moveMediaApi,
  patchMediaApi,
  uploadMediaApi,
  type MediaAsset,
  type MediaFolder,
} from "@/lib/api";
import { getAdminToken } from "@/lib/adminAuth";
import { format } from "date-fns";
import {
  CheckSquare,
  Copy,
  File as FileIcon,
  FileAudio2,
  FileVideo2,
  FolderPlus,
  Image as ImageIcon,
  Library,
  Pencil,
  RefreshCw,
  Search,
  Square,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  DragEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const envBase = (import.meta as any).env?.VITE_BACKEND_URL as string | undefined;
const lsBase =
  typeof window !== "undefined" && typeof localStorage !== "undefined"
    ? localStorage.getItem("__API_BASE")
    : null;
const winBase = (typeof window !== "undefined" && (window as any).__API_BASE) || undefined;
const originApi = typeof window !== "undefined" ? `${window.location.origin}/api` : undefined;
const API_BASE =
  (lsBase && lsBase.trim()) ||
  winBase ||
  (envBase && envBase.trim()) ||
  originApi ||
  "/api";
const ASSET_HOST = API_BASE.replace(/\/+api\/?$/, "");

function fullUrl(u: string) {
  if (!u) return "";
  if (u.startsWith("http")) return u;
  return `${ASSET_HOST}${u.startsWith("/") ? u : `/${u}`}`;
}
function fmtBytes(n: number) {
  if (!n) return "0 B";
  const u = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < u.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${u[i]}`;
}

export default function MediaLibraryPage() {
  const token = useMemo(() => getAdminToken() || "", []);
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [activeFolder, setActiveFolder] = useState<string>("__ALL__"); // __ALL__ = không lọc, '' = root
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [type, setType] = useState("all");
  const [loading, setLoading] = useState(false);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<MediaAsset | null>(null);
  const [confirmBulkDel, setConfirmBulkDel] = useState(false);
  const [confirmDelFolder, setConfirmDelFolder] = useState<MediaFolder | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [folderForm, setFolderForm] = useState({ name: "", description: "" });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  async function loadFolders() {
    try {
      const r = await listMediaFoldersApi(token);
      setFolders(r.folders);
    } catch (e: any) {
      toast({ title: "Lỗi tải folder", description: e?.message, variant: "destructive" });
    }
  }
  async function loadItems(p = page) {
    setLoading(true);
    try {
      const folderParam = activeFolder === "__ALL__" ? undefined : activeFolder;
      const r = await listMediaApi(
        { folder: folderParam, keyword, type, page: p, limit: 60 },
        token,
      );
      setItems(r.items);
      setTotal(r.total);
      setPage(r.page);
    } catch (e: any) {
      toast({ title: "Lỗi tải media", description: e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadFolders();
    // eslint-disable-next-line
  }, []);
  useEffect(() => {
    setSelected(new Set());
    loadItems(1);
    // eslint-disable-next-line
  }, [activeFolder, type]);

  function toggleSelect(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }
  function selectAllVisible() {
    const next = new Set(selected);
    items.forEach((it) => next.add(it._id));
    setSelected(next);
  }
  function clearSelection() {
    setSelected(new Set());
  }

  function copyUrl(url: string) {
    const u = fullUrl(url);
    navigator.clipboard.writeText(u).then(
      () => toast({ title: "Đã copy URL", description: u }),
      () => toast({ title: "Copy thất bại", variant: "destructive" }),
    );
  }

  async function doUpload(files: File[]) {
    if (!files.length) return;
    setUploading(true);
    setUploadProgress(0);
    const targetFolder = activeFolder === "__ALL__" ? "" : activeFolder;
    try {
      await uploadMediaApi(files, targetFolder, token, (loaded, totalB) => {
        setUploadProgress(Math.round((loaded / totalB) * 100));
      });
      toast({ title: `Đã upload ${files.length} tệp` });
      loadItems(1);
      loadFolders();
    } catch (e: any) {
      toast({ title: "Upload lỗi", description: e?.message, variant: "destructive" });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }
  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const fl = Array.from(e.dataTransfer.files || []);
    if (fl.length) doUpload(fl);
  }

  async function bulkDelete() {
    try {
      const r = await bulkDeleteMediaApi(Array.from(selected), token);
      toast({ title: `Đã xóa ${r.removed} tệp` });
      clearSelection();
      loadItems(page);
      loadFolders();
    } catch (e: any) {
      toast({ title: "Lỗi", description: e?.message, variant: "destructive" });
    } finally {
      setConfirmBulkDel(false);
    }
  }

  async function moveSelectedTo(folderSlug: string) {
    if (!selected.size) return;
    const target = folderSlug === "__ROOT__" ? "" : folderSlug;
    try {
      await Promise.all(Array.from(selected).map((id) => moveMediaApi(id, target, token)));
      toast({ title: `Đã chuyển ${selected.size} tệp` });
      clearSelection();
      loadItems(page);
      loadFolders();
    } catch (e: any) {
      toast({ title: "Lỗi chuyển", description: e?.message, variant: "destructive" });
    }
  }

  async function createFolder() {
    if (!folderForm.name.trim()) return;
    try {
      await createMediaFolderApi(folderForm, token);
      toast({ title: "Đã tạo folder" });
      setShowCreateFolder(false);
      setFolderForm({ name: "", description: "" });
      loadFolders();
    } catch (e: any) {
      toast({ title: "Lỗi", description: e?.message, variant: "destructive" });
    }
  }
  async function removeFolder(f: MediaFolder) {
    try {
      await deleteMediaFolderApi(f._id, token);
      toast({ title: "Đã xóa folder" });
      loadFolders();
      if (activeFolder === f.slug) setActiveFolder("__ALL__");
    } catch (e: any) {
      toast({ title: "Lỗi", description: e?.message, variant: "destructive" });
    } finally {
      setConfirmDelFolder(null);
    }
  }

  async function savePreviewMeta() {
    if (!preview) return;
    try {
      const r = await patchMediaApi(
        preview._id,
        {
          title: preview.title,
          alt: preview.alt,
          tags: preview.tags,
        },
        token,
      );
      setPreview(r);
      setItems((arr) => arr.map((x) => (x._id === r._id ? r : x)));
      toast({ title: "Đã lưu" });
    } catch (e: any) {
      toast({ title: "Lỗi", description: e?.message, variant: "destructive" });
    }
  }

  async function deleteSingle(id: string) {
    try {
      await deleteMediaApi(id, token);
      toast({ title: "Đã xóa" });
      setPreview(null);
      loadItems(page);
      loadFolders();
    } catch (e: any) {
      toast({ title: "Lỗi", description: e?.message, variant: "destructive" });
    }
  }

  const totalSize = folders.reduce((a, f) => a + (f.size || 0), 0);

  return (
    <AdminLayout>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Library className="size-6" /> Thư viện hình ảnh
          </h1>
          <p className="text-sm text-muted-foreground">
            Quản lý ảnh, video, tài liệu — tổ chức theo thư mục và copy URL nhúng.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { loadFolders(); loadItems(page); }} disabled={loading}>
            <RefreshCw className="mr-2 size-4" /> Làm mới
          </Button>
          <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <Upload className="mr-2 size-4" /> Upload
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => doUpload(Array.from(e.target.files || []))}
          />
        </div>
      </div>

      {uploading && (
        <Card className="mt-3">
          <CardContent className="p-3 text-sm">
            <div className="flex justify-between mb-1"><span>Đang upload…</span><span>{uploadProgress}%</span></div>
            <div className="w-full h-2 bg-muted rounded">
              <div className="h-full bg-primary rounded" style={{ width: `${uploadProgress}%` }} />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-12 gap-4 mt-4">
        {/* Sidebar folders */}
        <Card className="col-span-12 md:col-span-3">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm">Thư mục</h3>
              <Button size="icon" variant="ghost" onClick={() => setShowCreateFolder(true)} title="Tạo folder">
                <FolderPlus className="size-4" />
              </Button>
            </div>
            <ScrollArea className="h-[420px] pr-2">
              <ul className="space-y-1">
                <FolderRow
                  active={activeFolder === "__ALL__"}
                  label="Tất cả"
                  count={folders.reduce((a, f) => a + f.count, 0)}
                  onClick={() => setActiveFolder("__ALL__")}
                />
                {folders.map((f) => (
                  <FolderRow
                    key={f._id}
                    active={activeFolder === f.slug}
                    label={f.name || (f.slug ? f.slug : "(root)")}
                    count={f.count}
                    size={fmtBytes(f.size)}
                    onClick={() => setActiveFolder(f.slug)}
                    onDelete={f.slug ? () => setConfirmDelFolder(f) : undefined}
                  />
                ))}
              </ul>
            </ScrollArea>
            <div className="border-t mt-3 pt-2 text-xs text-muted-foreground">
              Tổng: {folders.reduce((a, f) => a + f.count, 0)} tệp · {fmtBytes(totalSize)}
            </div>
          </CardContent>
        </Card>

        {/* Main */}
        <Card className="col-span-12 md:col-span-9">
          <CardContent className="p-3">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-60">
                <Label className="text-xs">Tìm theo tên/title/tag</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    className="pl-8"
                    placeholder="search…"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && loadItems(1)}
                  />
                </div>
              </div>
              <div className="w-44">
                <Label className="text-xs">Loại tệp</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="image">Hình ảnh</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="document">Tài liệu</SelectItem>
                    <SelectItem value="other">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => loadItems(1)}>Tìm</Button>
            </div>

            {/* Bulk actions */}
            {selected.size > 0 && (
              <div className="mt-3 flex items-center gap-2 rounded border bg-muted/40 p-2 text-sm">
                <Badge>{selected.size} đã chọn</Badge>
                <Button size="sm" variant="ghost" onClick={clearSelection}>
                  <X className="mr-1 size-4" /> Bỏ chọn
                </Button>
                <div className="ml-auto flex items-center gap-2">
                  <Select onValueChange={moveSelectedTo}>
                    <SelectTrigger className="h-8 w-44"><SelectValue placeholder="Chuyển vào…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__ROOT__">(root)</SelectItem>
                      {folders.filter((f) => f.slug).map((f) => (
                        <SelectItem key={f._id} value={f.slug}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="destructive" onClick={() => setConfirmBulkDel(true)}>
                    <Trash2 className="mr-1 size-4" /> Xóa
                  </Button>
                </div>
              </div>
            )}

            {/* Drop zone + grid */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`mt-3 rounded-md border-2 border-dashed transition ${
                dragOver ? "border-primary bg-primary/5" : "border-muted"
              } p-3 min-h-[400px]`}
            >
              {!items.length ? (
                <div className="text-center text-muted-foreground py-16">
                  <Upload className="mx-auto size-8 mb-2 opacity-50" />
                  <p>{loading ? "Đang tải…" : "Kéo thả tệp vào đây hoặc bấm Upload"}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                  {items.map((it) => {
                    const isSel = selected.has(it._id);
                    return (
                      <div
                        key={it._id}
                        className={`group relative rounded border overflow-hidden bg-muted ${
                          isSel ? "ring-2 ring-primary" : ""
                        }`}
                      >
                        <button
                          type="button"
                          aria-label="Select"
                          onClick={(e) => { e.stopPropagation(); toggleSelect(it._id); }}
                          className="absolute top-1 left-1 z-10 bg-background/80 rounded p-0.5 opacity-0 group-hover:opacity-100 data-[on=true]:opacity-100"
                          data-on={isSel}
                        >
                          {isSel ? <CheckSquare className="size-4 text-primary" /> : <Square className="size-4" />}
                        </button>
                        <div className="aspect-square cursor-zoom-in" onClick={() => setPreview(it)}>
                          <Thumb item={it} />
                        </div>
                        <div className="p-1.5 text-xs">
                          <div className="truncate" title={it.originalName}>{it.title || it.originalName}</div>
                          <div className="text-muted-foreground flex justify-between mt-0.5">
                            <span>{fmtBytes(it.size)}</span>
                            {it.width ? <span>{it.width}×{it.height}</span> : null}
                          </div>
                        </div>
                        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100">
                          <Button size="icon" variant="secondary" className="size-7" onClick={(e) => { e.stopPropagation(); copyUrl(it.url); }} title="Copy URL">
                            <Copy className="size-3.5" />
                          </Button>
                          <Button size="icon" variant="secondary" className="size-7" onClick={(e) => { e.stopPropagation(); setPreview(it); }} title="Sửa">
                            <Pencil className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">Tổng: {total}</span>
                {items.length > 0 && (
                  <Button size="sm" variant="ghost" onClick={selectAllVisible}>Chọn tất cả trang này</Button>
                )}
              </div>
              <div className="space-x-2">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => loadItems(page - 1)}>Trước</Button>
                <span className="text-xs text-muted-foreground">Trang {page} / {Math.max(1, Math.ceil(total / 60))}</span>
                <Button size="sm" variant="outline" disabled={page * 60 >= total} onClick={() => loadItems(page + 1)}>Sau</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview / edit dialog */}
      <Dialog open={!!preview} onOpenChange={(v) => !v && setPreview(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="truncate">{preview?.originalName}</DialogTitle>
            <DialogDescription>
              {preview?.mime} · {fmtBytes(preview?.size || 0)}
              {preview?.width ? ` · ${preview.width}×${preview.height}` : ""}
            </DialogDescription>
          </DialogHeader>
          {preview && (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-muted rounded grid place-items-center min-h-[300px] max-h-[60vh] overflow-auto">
                {preview.type === "image" ? (
                  <img src={fullUrl(preview.url)} alt={preview.alt || preview.originalName} className="max-w-full max-h-[60vh] object-contain" />
                ) : preview.type === "video" ? (
                  <video src={fullUrl(preview.url)} controls className="max-w-full max-h-[60vh]" />
                ) : preview.type === "audio" ? (
                  <audio src={fullUrl(preview.url)} controls className="w-full" />
                ) : (
                  <div className="text-center p-8">
                    <FileIcon className="mx-auto size-12 mb-3 opacity-50" />
                    <a href={fullUrl(preview.url)} target="_blank" rel="noopener" className="text-primary underline">
                      Mở tệp
                    </a>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div>
                  <Label>URL</Label>
                  <div className="flex gap-2 mt-1">
                    <Input readOnly value={fullUrl(preview.url)} className="font-mono text-xs" />
                    <Button size="icon" variant="outline" onClick={() => copyUrl(preview.url)}>
                      <Copy className="size-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Title</Label>
                  <Input value={preview.title || ""} onChange={(e) => setPreview({ ...preview, title: e.target.value })} />
                </div>
                <div>
                  <Label>Alt text (cho ảnh)</Label>
                  <Input value={preview.alt || ""} onChange={(e) => setPreview({ ...preview, alt: e.target.value })} />
                </div>
                <div>
                  <Label>Tags (cách bằng phẩy)</Label>
                  <Textarea
                    rows={2}
                    value={(preview.tags || []).join(", ")}
                    onChange={(e) =>
                      setPreview({
                        ...preview,
                        tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Folder</Label>
                  <Select
                    value={preview.folder || "__ROOT__"}
                    onValueChange={async (v) => {
                      const target = v === "__ROOT__" ? "" : v;
                      try {
                        const r = await moveMediaApi(preview._id, target, token);
                        setPreview(r);
                        loadItems(page);
                        loadFolders();
                      } catch (e: any) {
                        toast({ title: "Lỗi chuyển", description: e?.message, variant: "destructive" });
                      }
                    }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__ROOT__">(root)</SelectItem>
                      {folders.filter((f) => f.slug).map((f) => (
                        <SelectItem key={f._id} value={f.slug}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-xs text-muted-foreground">
                  Tải lên: {preview.uploadedByName || "—"} · {preview.createdAt ? format(new Date(preview.createdAt), "dd/MM/yy HH:mm") : "—"}
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              onClick={() => preview && deleteSingle(preview._id)}
            >
              <Trash2 className="mr-2 size-4" /> Xóa
            </Button>
            <div className="flex-1" />
            <Button variant="outline" onClick={() => setPreview(null)}>Đóng</Button>
            <Button onClick={savePreviewMeta}>Lưu meta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create folder */}
      <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo thư mục mới</DialogTitle>
            <DialogDescription>Tên sẽ được slug-hóa thành tên thư mục trên đĩa.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Tên</Label>
              <Input value={folderForm.name} onChange={(e) => setFolderForm({ ...folderForm, name: e.target.value })} placeholder="Banner Tết 2026" />
            </div>
            <div>
              <Label>Mô tả (tùy chọn)</Label>
              <Textarea rows={2} value={folderForm.description} onChange={(e) => setFolderForm({ ...folderForm, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateFolder(false)}>Hủy</Button>
            <Button onClick={createFolder}>Tạo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmBulkDel} onOpenChange={setConfirmBulkDel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa {selected.size} tệp?</AlertDialogTitle>
            <AlertDialogDescription>Hành động không thể hoàn tác. Tệp sẽ bị xóa khỏi đĩa.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={bulkDelete}>Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmDelFolder} onOpenChange={(v) => !v && setConfirmDelFolder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa folder "{confirmDelFolder?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Folder phải trống (chuyển hết tệp đi trước). Hiện có {confirmDelFolder?.count || 0} tệp.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDelFolder && removeFolder(confirmDelFolder)}>Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}

function FolderRow({
  active, label, count, size, onClick, onDelete,
}: {
  active: boolean;
  label: string;
  count: number;
  size?: string;
  onClick: () => void;
  onDelete?: () => void;
}) {
  return (
    <li>
      <div
        className={`flex items-center justify-between rounded px-2 py-1.5 cursor-pointer text-sm ${
          active ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
        }`}
        onClick={onClick}
      >
        <span className="truncate flex-1" title={label}>{label}</span>
        <Badge variant="outline" className="ml-2 text-xs">{count}</Badge>
        {onDelete && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="ml-1 opacity-0 hover:opacity-100 group-hover:opacity-100"
            title="Xóa folder"
          >
            <X className="size-3.5 text-muted-foreground hover:text-destructive" />
          </button>
        )}
      </div>
      {size && <div className="px-2 text-[10px] text-muted-foreground">{size}</div>}
    </li>
  );
}

function Thumb({ item }: { item: MediaAsset }) {
  if (item.type === "image") {
    return <img src={fullUrl(item.url)} alt={item.alt || item.originalName} className="size-full object-cover" loading="lazy" />;
  }
  const Icon =
    item.type === "video" ? FileVideo2 :
    item.type === "audio" ? FileAudio2 :
    item.type === "image" ? ImageIcon :
    FileIcon;
  return (
    <div className="size-full grid place-items-center bg-muted/50">
      <Icon className="size-10 opacity-60" />
    </div>
  );
}
