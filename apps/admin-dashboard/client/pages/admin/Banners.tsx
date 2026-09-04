import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import React from "react";
import { toast } from "@/components/ui/use-toast";
import { getAdminBanners, createBannerApi, updateBannerApi, deleteBannerApi } from "@/lib/api";
import { getAdminToken } from "@/lib/adminAuth";

const token = () => getAdminToken() || "";
const envBase = (import.meta as any).env?.VITE_BACKEND_URL as string | undefined;
const lsBase = (typeof window !== "undefined" && typeof localStorage !== "undefined") ? localStorage.getItem("__API_BASE") : null;
const winBase = (typeof window !== "undefined" && (window as any).__API_BASE) || undefined;
const originApi = (typeof window !== "undefined") ? `${window.location.origin}/api` : undefined;
const API_BASE = (lsBase && lsBase.trim()) || winBase || (envBase && envBase.trim()) || originApi || "/api";
const ASSET_HOST = API_BASE.replace(/\/+api\/?$/, "");

/** Đồng bộ khung banner trên frontend1 (`--banner-page-h-sm` / `--banner-page-h-md`). */
const BANNER_SPEC_HINT =
  "Khung trên web: cao 220px (mobile) / 291px (màn hình ≥768px), ảnh crop giữa (object-cover). Gợi ý upload file ngang ~1920×640 px (~3:1).";

type Banner = {
  _id: string;
  image: string;
  link?: string;
  order: number;
  status: boolean;
  createdAt: string;
};

export function BannersPanel() {
  const [rows, setRows] = React.useState<Banner[]>([]);
  const [loading, setLoading] = React.useState(false);

  const [order, setOrder] = React.useState<number>(0);
  const [status, setStatus] = React.useState<boolean>(true);
  const [file, setFile] = React.useState<File | null>(null);
  const [createLink, setCreateLink] = React.useState("");
  const [createImageUrl, setCreateImageUrl] = React.useState("");

  async function load() {
    setLoading(true);
    try {
      const data = await getAdminBanners(token());
      setRows((data as any) || []);
    } catch (e: any) {
      toast({ title: "Load failed", description: e?.message || "", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); }, []);

  function updateRow(idx: number, patch: Partial<Banner>) {
    setRows((prev) => prev.map((r, i) => (i === idx ? ({ ...r, ...patch } as Banner) : r)));
  }

  async function saveRow(idx: number, newFile?: File | null) {
    const row = rows[idx];
    try {
      await updateBannerApi(row._id, {
        order: row.order,
        status: row.status,
        file: newFile || undefined,
        link: row.link ?? "",
      }, token());
      toast({ title: "Saved" });
      await load();
    } catch (e: any) {
      toast({ title: "Save failed", description: e?.message || "", variant: "destructive" });
    }
  }

  async function deleteRow(id: string) {
    try {
      await deleteBannerApi(id, token());
      toast({ title: "Deleted" });
      await load();
    } catch (e: any) {
      toast({ title: "Delete failed", description: e?.message || "", variant: "destructive" });
    }
  }

  async function createBanner(e: React.FormEvent) {
    e.preventDefault();
    if (!file && !createImageUrl.trim()) {
      toast({ title: "Thiếu ảnh", description: "Chọn file hoặc nhập URL/path ảnh.", variant: "destructive" });
      return;
    }
    try {
      await createBannerApi({
        order,
        status,
        file: file || undefined,
        image: createImageUrl.trim() || undefined,
        link: createLink.trim() || undefined,
      }, token());
      toast({ title: "Banner created" });
      setOrder(0); setStatus(true); setFile(null); setCreateLink(""); setCreateImageUrl("");
      await load();
    } catch (e: any) {
      toast({ title: "Create failed", description: e?.message || "", variant: "destructive" });
    }
  }

  return (
    <>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-lg font-semibold md:text-xl">Banners</h1>
          <Button variant="outline" onClick={load} disabled={loading}>{loading?"Loading...":"Refresh"}</Button>
        </div>

        <p className="mt-2 max-w-3xl text-xs text-muted-foreground leading-relaxed">{BANNER_SPEC_HINT}</p>

        <Card className="mt-4">
          <CardHeader><CardTitle className="text-base">Create Banner</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={createBanner} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
              <Input type="number" placeholder="Order" value={order} onChange={(e)=>setOrder(Number(e.target.value)||0)} required />
              <div className="flex items-center justify-between sm:justify-start gap-2 lg:col-span-2"><span className="text-xs text-muted-foreground">Active</span><Switch checked={status} onCheckedChange={(v)=>setStatus(Boolean(v))} /></div>
              <Input type="file" accept="image/*" onChange={(e)=>setFile(e.target.files?.[0]||null)} className="w-full lg:col-span-2" />
              <Input placeholder="URL/path ảnh (nếu không upload file)" value={createImageUrl} onChange={(e)=>setCreateImageUrl(e.target.value)} className="lg:col-span-2" />
              <Input placeholder="Link khi click (tùy chọn)" value={createLink} onChange={(e)=>setCreateLink(e.target.value)} className="lg:col-span-3" />
              <Button type="submit" className="w-full sm:w-auto lg:col-span-1">Create</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader><CardTitle className="text-base">Existing Banners</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            {/* Desktop table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Preview</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, idx) => (
                    <TableRow key={r._id}>
                      <TableCell className="min-w-48">
                        {r.image ? (
                          <div className="aspect-[1920/291] w-full max-w-[220px] overflow-hidden rounded border border-border">
                            <img src={`${ASSET_HOST}/${r.image}`} alt="banner" className="size-full object-cover" />
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No image</span>
                        )}
                        <Input className="mt-2 w-full" type="file" accept="image/*" onChange={(e)=>saveRow(idx, e.target.files?.[0])} />
                      </TableCell>
                      <TableCell className="min-w-40">
                        <Input
                          placeholder="https://…"
                          value={r.link ?? ""}
                          onChange={(e)=>updateRow(idx, { link: e.target.value })}
                        />
                      </TableCell>
                      <TableCell className="min-w-28">
                        <Input type="number" value={r.order} onChange={(e)=>updateRow(idx,{order:Number(e.target.value)||0})} />
                      </TableCell>
                      <TableCell className="min-w-28">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">Active<Switch checked={r.status} onCheckedChange={(v)=>updateRow(idx,{status:Boolean(v)})} /></div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground min-w-40">{new Date(r.createdAt).toLocaleString()}</TableCell>
                      <TableCell className="min-w-40">
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" onClick={()=>saveRow(idx)}>Save</Button>
                          <Button size="sm" variant="destructive" onClick={()=>deleteRow(r._id)}>Delete</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {rows.length===0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-sm text-muted-foreground">No banners</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile list */}
            <div className="grid gap-3 md:hidden">
              {rows.map((r, idx) => (
                <div key={r._id} className="rounded-lg border p-3 grid gap-2">
                  <div className="flex items-center gap-3">
                    {r.image ? (
                      <div className="aspect-[1920/291] w-28 shrink-0 overflow-hidden rounded border border-border">
                        <img src={`${ASSET_HOST}/${r.image}`} alt="banner" className="size-full object-cover" />
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">No image</span>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs text-muted-foreground">Created</div>
                      <div className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <Input placeholder="Link khi click" value={r.link ?? ""} onChange={(e)=>updateRow(idx, { link: e.target.value })} />
                  <Input type="number" value={r.order} onChange={(e)=>updateRow(idx,{order:Number(e.target.value)||0})} placeholder="Order" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Active</span>
                    <Switch checked={r.status} onCheckedChange={(v)=>updateRow(idx,{status:Boolean(v)})} />
                  </div>
                  <Input className="w-full" type="file" accept="image/*" onChange={(e)=>saveRow(idx, e.target.files?.[0])} />
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={()=>saveRow(idx)} className="flex-1 sm:flex-none">Save</Button>
                    <Button size="sm" variant="destructive" onClick={()=>deleteRow(r._id)} className="flex-1 sm:flex-none">Delete</Button>
                  </div>
                </div>
              ))}
              {rows.length===0 && (
                <div className="text-sm text-muted-foreground">No banners</div>
              )}
            </div>
          </CardContent>
        </Card>
    </>
  );
}

export default function Banners() {
  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <BannersPanel />
      </AdminLayout>
    </RequireSuperAdmin>
  );
}
