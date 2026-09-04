import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@game/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@game/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@game/ui/dialog";
import { Input } from "@game/ui/input";
import { Label } from "@game/ui/label";
import { Switch } from "@game/ui/switch";
import { Textarea } from "@game/ui/textarea";
import { toast } from "@game/ui/use-toast";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  getPackages,
  getPackageCategories,
  createPackageCategory,
  createPackage,
  updatePackage,
  deletePackage,
  listMediaApi,
  type IPackageCategory,
  type IPackage,
  type MediaAsset,
} from "@/lib/api";
import { getAdminToken } from "@/lib/adminAuth";

export default function Packages() {
  const [packages, setPackages] = useState<IPackage[]>([]);
  const [categories, setCategories] = useState<IPackageCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const token = useMemo(() => getAdminToken() || "", []);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [createForm, setCreateForm] = useState({
    title: "",
    slug: "",
    description: "",
    categoryIds: [] as string[],
    primaryCategoryId: "",
    image: "",
    goldCoins: 0,
    freeCoins: 0,
    price: 0,
    soldCount: 0,
    noindex: false,
    order: 0,
    isActive: true,
  });
  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaAsset[]>([]);
  const [mediaKeyword, setMediaKeyword] = useState("");
  const [mediaPage, setMediaPage] = useState(1);
  const [mediaTotal, setMediaTotal] = useState(0);
  const [mediaTarget, setMediaTarget] = useState<"create" | string>("create");

  function toSlug(s: string) {
    return String(s || "")
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async function loadPackages() {
    setLoading(true);
    try {
      const [data, cats] = await Promise.all([
        getPackages(token),
        getPackageCategories(token),
      ]);
      setPackages(Array.isArray((data as any)?.items) ? (data as any).items : []);
      setCategories(Array.isArray(cats) ? cats : []);
    } catch (e: any) {
      toast({
        title: "Tải gói thất bại",
        description: e?.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPackages();
  }, []);

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const payload = {
      title: createForm.title.trim(),
      slug: createForm.slug || toSlug(createForm.title),
      description: createForm.description,
      categoryIds: createForm.categoryIds,
      primaryCategoryId: createForm.primaryCategoryId || createForm.categoryIds[0] || "",
      image: createForm.image || "",
      goldCoins: Number(createForm.goldCoins || 0),
      freeCoins: Number(createForm.freeCoins || 0),
      price: Number(createForm.price || 0),
      soldCount: Number(createForm.soldCount || 0),
      noindex: createForm.noindex,
      order: Number(createForm.order || 0),
      status: createForm.isActive ? ("active" as const) : ("inactive" as const),
    };

    if (!payload.title || !payload.slug || !payload.price) {
      toast({ title: "Vui lòng nhập đầy đủ thông tin", variant: "destructive" });
      return;
    }
    if (!payload.categoryIds.length) {
      toast({ title: "Vui lòng chọn ít nhất 1 chuyên mục", variant: "destructive" });
      return;
    }

    try {
      await createPackage(payload, token);
      toast({ title: "Đã tạo gói" });
      setCreateForm({
        title: "",
        slug: "",
        description: "",
        categoryIds: [],
        primaryCategoryId: "",
        image: "",
        goldCoins: 0,
        freeCoins: 0,
        price: 0,
        soldCount: 0,
        noindex: false,
        order: 0,
        isActive: true,
      });
      await loadPackages();
    } catch (e: any) {
      toast({
        title: "Tạo thất bại",
        description: e?.message,
        variant: "destructive",
      });
    }
  }

  async function loadMedia(page = 1, keyword = mediaKeyword) {
    setMediaLoading(true);
    try {
      const r = await listMediaApi({ type: "image", page, limit: 24, keyword }, token);
      setMediaItems(r.items || []);
      setMediaTotal(r.total || 0);
      setMediaPage(r.page || 1);
    } catch (e: any) {
      toast({ title: "Tải Media Library thất bại", description: e?.message, variant: "destructive" });
    } finally {
      setMediaLoading(false);
    }
  }

  function openMediaPicker(target: "create" | string) {
    setMediaTarget(target);
    setMediaOpen(true);
    loadMedia(1, "");
  }

  function applyImageFromMedia(url: string) {
    if (mediaTarget === "create") {
      setCreateForm((prev) => ({ ...prev, image: url }));
    } else {
      setPackages((prev) =>
        prev.map((pkg) => (pkg._id === mediaTarget ? { ...pkg, image: url } : pkg)),
      );
    }
    setMediaOpen(false);
  }

  function toggleCreateCategory(categoryId: string, checked: boolean) {
    setCreateForm((prev) => {
      const nextIds = checked
        ? Array.from(new Set([...prev.categoryIds, categoryId]))
        : prev.categoryIds.filter((id) => id !== categoryId);
      const nextPrimary = nextIds.includes(prev.primaryCategoryId)
        ? prev.primaryCategoryId
        : (nextIds[0] || "");
      return { ...prev, categoryIds: nextIds, primaryCategoryId: nextPrimary };
    });
  }

  function toggleEditCategory(idx: number, categoryId: string, checked: boolean) {
    setPackages((prev) => {
      const next = [...prev];
      const current = next[idx];
      const currentIds = current.categoryIds || [];
      const nextIds = checked
        ? Array.from(new Set([...currentIds, categoryId]))
        : currentIds.filter((id) => id !== categoryId);
      next[idx] = {
        ...current,
        categoryIds: nextIds,
        primaryCategoryId: nextIds.includes(current.primaryCategoryId || "")
          ? current.primaryCategoryId
          : (nextIds[0] || ""),
      };
      return next;
    });
  }

  async function onSave(l: IPackage) {
    try {
      await updatePackage(l._id, {
        title: l.title,
        slug: l.slug,
        description: l.description,
        categoryIds: l.categoryIds || [],
        primaryCategoryId: l.primaryCategoryId || "",
        image: l.image || "",
        goldCoins: l.goldCoins,
        freeCoins: l.freeCoins,
        price: l.price,
        soldCount: Number(l.soldCount || 0),
        noindex: Boolean(l.noindex),
        order: l.order,
        status: l.status,
        ...(l.benefits !== undefined ? { benefits: l.benefits } : {}),
      }, token);
      toast({ title: "Đã cập nhật gói" });
      await loadPackages();
    } catch (e: any) {
      toast({
        title: "Cập nhật thất bại",
        description: e?.message,
        variant: "destructive",
      });
    }
  }

  async function onDelete(l: IPackage) {
    if (!confirm("Xoá gói này?")) return;
    try {
      await deletePackage(l._id, token);
      toast({ title: "Đã xoá gói" });
      await loadPackages();
    } catch (e: any) {
      toast({
        title: "Xoá thất bại",
        description: e?.message,
        variant: "destructive",
      });
    }
  }

  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold md:text-xl">Quản lý gói Store</h1>
          <Button variant="outline" onClick={loadPackages} disabled={loading}>
            {loading ? "Đang tải..." : "Làm mới"}
          </Button>
        </div>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Chuyên mục sản phẩm</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Tên chuyên mục"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <Button
                type="button"
                onClick={async () => {
                  if (!newCategoryName.trim()) return;
                  await createPackageCategory({ name: newCategoryName, slug: toSlug(newCategoryName) }, token);
                  setNewCategoryName("");
                  await loadPackages();
                  toast({ title: "Đã thêm chuyên mục" });
                }}
              >
                Thêm chuyên mục
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              {categories.map((c) => c.name).join(", ") || "Chưa có chuyên mục"}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Tạo gói hàng mới</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Tên sản phẩm *</Label>
                <Input
                  name="title"
                  placeholder="Nhập tên sản phẩm"
                  required
                  value={createForm.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setCreateForm((prev) => ({ ...prev, title, slug: toSlug(title) }));
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label>Slug (tự động)</Label>
                <Input name="slug" value={createForm.slug} readOnly />
                <p className="text-xs text-muted-foreground">Tự sinh realtime từ tên sản phẩm</p>
              </div>
              <div className="space-y-2 md:col-span-1">
                <Label>Chuyên mục *</Label>
                <div className="rounded border p-2 max-h-36 overflow-auto space-y-1">
                  {categories.map((c) => {
                    const checked = createForm.categoryIds.includes(c._id);
                    return (
                      <label key={c._id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => toggleCreateCategory(c._id, e.target.checked)}
                        />
                        <span>{c.name}</span>
                      </label>
                    );
                  })}
                  {categories.length === 0 && (
                    <div className="text-xs text-muted-foreground">Chưa có chuyên mục</div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Chọn nhiều chuyên mục bằng checkbox</p>
              </div>
              <div className="space-y-1">
                <Label>Giá (VND)</Label>
                <Input
                  name="price"
                  type="number"
                  required
                  value={createForm.price}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, price: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Thứ tự</Label>
                <Input
                  name="order"
                  type="number"
                  value={createForm.order}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, order: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Số lượng đã bán</Label>
                <Input
                  name="soldCount"
                  type="number"
                  value={createForm.soldCount}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, soldCount: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Chuyên mục chính</Label>
                <select
                  className="w-full h-10 rounded-md border px-3 text-sm bg-background"
                  value={createForm.primaryCategoryId || ""}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, primaryCategoryId: e.target.value }))
                  }
                >
                  <option value="">Tự động lấy chuyên mục đầu tiên</option>
                  {categories
                    .filter((c) => createForm.categoryIds.includes(c._id))
                    .map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Ảnh sản phẩm</Label>
                <Input
                  name="image"
                  placeholder="Chọn từ Media Library"
                  value={createForm.image}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, image: e.target.value }))}
                />
                <Button type="button" variant="outline" onClick={() => openMediaPicker("create")}>
                  Chọn ảnh từ Media Library
                </Button>
                <p className="text-xs text-muted-foreground">Không cần copy path thủ công</p>
              </div>
              <div className="space-y-1">
                <Label>Số coin vàng</Label>
                <Input
                  name="goldCoins"
                  type="number"
                  required
                  value={createForm.goldCoins}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, goldCoins: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Số coin miễn phí</Label>
                <Input
                  name="freeCoins"
                  type="number"
                  value={createForm.freeCoins}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, freeCoins: Number(e.target.value) }))}
                />
              </div>
              <div className="md:col-span-3 space-y-1">
                <Label>Mô tả ngắn</Label>
                <Textarea
                  name="description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="md:col-span-3 flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={createForm.isActive}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                  />
                  Kích hoạt sản phẩm
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="noindex"
                    checked={createForm.noindex}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, noindex: e.target.checked }))}
                  />
                  Noindex (ẩn khỏi Google)
                </label>
              </div>
              <div className="md:col-span-3">
                <Button type="submit">Tạo gói</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Danh sách gói hiện có</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {packages.map((l, idx) => (
                <div key={l._id} className="border p-4 rounded-lg space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label>Tên sản phẩm</Label>
                      <Input value={l.title} onChange={(e) => {
                        const newP = [...packages];
                        newP[idx].title = e.target.value;
                        setPackages(newP);
                      }} />
                    </div>
                    <div className="space-y-1">
                      <Label>Slug</Label>
                      <Input value={l.slug || ""} onChange={(e) => {
                        const newP = [...packages];
                        (newP[idx] as any).slug = e.target.value;
                        setPackages(newP);
                      }} />
                    </div>
                    <div className="space-y-1">
                      <Label>Giá</Label>
                      <Input type="number" value={l.price} onChange={(e) => {
                        const newP = [...packages];
                        newP[idx].price = Number(e.target.value);
                        setPackages(newP);
                      }} />
                    </div>
                    <div className="space-y-1">
                      <Label>Vàng</Label>
                      <Input type="number" value={l.goldCoins} onChange={(e) => {
                        const newP = [...packages];
                        newP[idx].goldCoins = Number(e.target.value);
                        setPackages(newP);
                      }} />
                    </div>
                    <div className="space-y-1 flex flex-col justify-end">
                      <div className="flex items-center gap-2 mb-2">
                        <Label>Trạng thái</Label>
                        <Switch checked={l.status === 'active'} onCheckedChange={(v) => {
                          const newP = [...packages];
                          newP[idx].status = v ? 'active' : 'inactive';
                          setPackages(newP);
                        }} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label>Noindex</Label>
                      <Switch checked={Boolean(l.noindex)} onCheckedChange={(v) => {
                        const newP = [...packages];
                        (newP[idx] as any).noindex = v;
                        setPackages(newP);
                      }} />
                    </div>
                    <div className="space-y-1">
                      <Label>Sold count</Label>
                      <Input type="number" value={Number(l.soldCount || 0)} onChange={(e) => {
                        const newP = [...packages];
                        (newP[idx] as any).soldCount = Number(e.target.value);
                        setPackages(newP);
                      }} />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <Label>Ảnh sản phẩm</Label>
                      <Input value={l.image || ""} onChange={(e) => {
                        const newP = [...packages];
                        (newP[idx] as any).image = e.target.value;
                        setPackages(newP);
                      }} />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openMediaPicker(l._id)}
                      >
                        Chọn từ Media Library
                      </Button>
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <Label>Chuyên mục (multi-select)</Label>
                      <div className="rounded border p-2 max-h-36 overflow-auto space-y-1">
                        {categories.map((c) => {
                          const checked = (l.categoryIds || []).includes(c._id);
                          return (
                            <label key={c._id} className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => toggleEditCategory(idx, c._id, e.target.checked)}
                              />
                              <span>{c.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" onClick={() => onSave(l)}>Lưu thay đổi</Button>
                    <Button size="sm" variant="destructive" onClick={() => onDelete(l)}>Xoá</Button>
                  </div>
                </div>
              ))}
              {packages.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">Không có gói nào</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Dialog open={mediaOpen} onOpenChange={setMediaOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Chọn ảnh từ Media Library</DialogTitle>
            </DialogHeader>
            <div className="flex gap-2">
              <Input
                placeholder="Tìm theo tên ảnh..."
                value={mediaKeyword}
                onChange={(e) => setMediaKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") loadMedia(1, mediaKeyword);
                }}
              />
              <Button type="button" variant="outline" onClick={() => loadMedia(1, mediaKeyword)}>
                Tìm
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-[60vh] overflow-auto">
              {mediaItems.map((item) => (
                <button
                  key={item._id}
                  type="button"
                  className="rounded border overflow-hidden text-left hover:border-primary"
                  onClick={() => applyImageFromMedia(item.url)}
                >
                  <img
                    src={item.url}
                    alt={item.alt || item.originalName}
                    className="w-full aspect-square object-cover"
                    loading="lazy"
                  />
                  <div className="p-2 text-xs truncate">{item.title || item.originalName}</div>
                </button>
              ))}
              {!mediaLoading && mediaItems.length === 0 && (
                <div className="col-span-full text-center text-sm text-muted-foreground py-8">
                  Không có ảnh
                </div>
              )}
            </div>
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                disabled={mediaPage <= 1}
                onClick={() => loadMedia(mediaPage - 1, mediaKeyword)}
              >
                Trước
              </Button>
              <div className="text-xs text-muted-foreground">
                Trang {mediaPage} / {Math.max(1, Math.ceil(mediaTotal / 24))}
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={mediaPage * 24 >= mediaTotal}
                onClick={() => loadMedia(mediaPage + 1, mediaKeyword)}
              >
                Sau
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </RequireSuperAdmin>
  );
}
