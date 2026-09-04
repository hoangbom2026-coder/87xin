import * as React from "react";
import { useEffect, useRef, useState } from "react";
import {
  GamepadIcon,
  RefreshCw,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Upload,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

import AdminLayout from "@/components/layout/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@game/ui/card";
import { Button } from "@game/ui/button";
import { Input } from "@game/ui/input";
import { toast } from "@game/ui/use-toast";
import { getAdminToken } from "@/lib/adminAuth";
import {
  GameMenuItem,
  getGameMenuConfig,
  updateGameMenuConfig,
  uploadGameIconAsset,
} from "@/lib/api";

const DEFAULTS: GameMenuItem[] = [
  { key: "table-games", label: "Table Games", icon: "/images/icons/icon-nav/table-games.webp", path: "/table-games", enabled: true, order: 1 },
  { key: "slots",       label: "Slots",       icon: "/images/icons/icon-nav/slots.webp",       path: "/slots",       enabled: true, order: 2 },
  { key: "game-bai",    label: "Game Bài",    icon: "/images/icons/icon-nav/game-bai.webp",    path: "/poker",       enabled: true, order: 3 },
  { key: "no-hu",       label: "Nổ Hũ",       icon: "/images/icons/icon-nav/no-hu.webp",       path: "/slots",       enabled: true, order: 4 },
  { key: "quay-so",     label: "Xổ Số",       icon: "/images/icons/icon-nav/quay-so.webp",     path: "/lottery",     enabled: true, order: 5 },
  { key: "ban-ca",      label: "Bắn Cá",      icon: "/images/icons/icon-nav/ban-ca.webp",      path: "/fishing",     enabled: true, order: 6 },
  { key: "da-ga",       label: "Đá Gà",       icon: "/images/icons/icon-nav/da-ga.webp",       path: "/Cockking",    enabled: true, order: 7 },
];

const slugify = (s: string) =>
  s.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

/** Path tương đối (/images/icons/icon-nav/... hay /game-icons/...) hoặc URL tuyệt đối — đều render trực tiếp. */
const previewSrc = (icon: string) => icon || "";

export default function GameMenuManager() {
  const token = getAdminToken();
  const [items, setItems] = useState<GameMenuItem[]>([]);
  const [originalJson, setOriginalJson] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await getGameMenuConfig(token);
      const list = (res.items || []).map((it, i) => ({ ...it, order: it.order ?? i + 1 }));
      setItems(list);
      setOriginalJson(JSON.stringify(list));
    } catch (e) {
      toast({ title: "Tải cấu hình thất bại", description: String((e as Error).message || e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dirty = JSON.stringify(items) !== originalJson;

  const validate = (): string | null => {
    if (!items.length) return "Cần ít nhất 1 item.";
    const seen = new Set<string>();
    for (const it of items) {
      if (!it.key || !/^[a-z0-9][a-z0-9-]*$/.test(it.key)) return `Key "${it.key}" không hợp lệ (a-z, 0-9, -).`;
      if (seen.has(it.key)) return `Key trùng: ${it.key}`;
      seen.add(it.key);
      if (!it.label.trim()) return `Label cho ${it.key} không được rỗng.`;
      if (!it.path.trim()) return `Path cho ${it.key} không được rỗng.`;
    }
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      toast({ title: "Dữ liệu chưa hợp lệ", description: err, variant: "destructive" });
      return;
    }
    if (!token) return;
    setSaving(true);
    try {
      const ordered = items.map((it, i) => ({ ...it, order: i + 1 }));
      const res = await updateGameMenuConfig(token, ordered);
      setItems(res.items);
      setOriginalJson(JSON.stringify(res.items));
      toast({ title: "Đã lưu cấu hình Game Menu" });
    } catch (e) {
      toast({ title: "Lưu thất bại", description: String((e as Error).message || e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!confirm("Đặt lại về cấu hình mặc định? Thay đổi chưa lưu sẽ mất.")) return;
    setItems(DEFAULTS.map((d) => ({ ...d })));
  };

  const updateRow = (idx: number, patch: Partial<GameMenuItem>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const removeRow = (idx: number) => {
    if (!confirm(`Xoá item "${items[idx].label}"?`)) return;
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const move = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= items.length) return;
    setItems((prev) => {
      const next = [...prev];
      [next[idx], next[j]] = [next[j], next[idx]];
      return next.map((it, i) => ({ ...it, order: i + 1 }));
    });
  };

  const addRow = () => {
    const baseKey = "new-game";
    let suffix = 1;
    while (items.some((it) => it.key === (suffix === 1 ? baseKey : `${baseKey}-${suffix}`))) suffix++;
    const key = suffix === 1 ? baseKey : `${baseKey}-${suffix}`;
    setItems((prev) => [
      ...prev,
      { key, label: "New Game", icon: "", path: "/", enabled: true, order: prev.length + 1 },
    ]);
  };

  const handleUpload = async (idx: number, file: File) => {
    if (!token) return;
    try {
      const res = await uploadGameIconAsset(token, file);
      updateRow(idx, { icon: res.url });
      toast({ title: "Đã upload icon", description: res.url });
    } catch (e) {
      toast({ title: "Upload thất bại", description: String((e as Error).message || e), variant: "destructive" });
    }
  };

  return (
    <AdminLayout>
      <AdminPageHeader
        icon={GamepadIcon}
        title="Quản lý Game Menu"
        description="Dải icon ngang Home + CategoryTabs — đổi URL/upload icon, label, path, bật/tắt, sắp xếp thứ tự."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Tải lại
        </Button>
        <Button variant="outline" size="sm" onClick={handleReset}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Đặt lại mặc định
        </Button>
        <Button variant="outline" size="sm" onClick={addRow}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm item
        </Button>
        <div className="ml-auto" />
        <Button size="sm" onClick={handleSave} disabled={!dirty || saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Đang lưu…" : dirty ? "Lưu thay đổi" : "Đã lưu"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">7 mục mặc định: Table Games · Slots · Game Bài · Nổ Hũ · Xổ Số · Bắn Cá · Đá Gà (Lô đề gộp trong Xổ số)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Đang tải…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b">
                    <th className="px-2 py-2 text-left">#</th>
                    <th className="px-2 py-2 text-left">Icon</th>
                    <th className="px-2 py-2 text-left">Key (slug)</th>
                    <th className="px-2 py-2 text-left">Label</th>
                    <th className="px-2 py-2 text-left">Icon URL / Upload</th>
                    <th className="px-2 py-2 text-left">Path</th>
                    <th className="px-2 py-2 text-left">Hiển thị</th>
                    <th className="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={`${it.key}-${idx}`} className="border-b align-top last:border-0">
                      <td className="px-2 py-3">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs font-semibold">{idx + 1}</span>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => move(idx, -1)} disabled={idx === 0}>
                              <ArrowUp className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => move(idx, 1)} disabled={idx === items.length - 1}>
                              <ArrowDown className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-lg border bg-muted/40">
                          {it.icon ? (
                            <img
                              src={previewSrc(it.icon)}
                              alt={it.label}
                              className="h-full w-full object-contain"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.opacity = "0.25";
                              }}
                            />
                          ) : (
                            <span className="text-[10px] text-muted-foreground">no img</span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <Input
                          value={it.key}
                          onChange={(e) => updateRow(idx, { key: slugify(e.target.value) })}
                          className="h-8 w-28 text-xs"
                          placeholder="slug-key"
                        />
                      </td>
                      <td className="px-2 py-3">
                        <Input
                          value={it.label}
                          onChange={(e) => updateRow(idx, { label: e.target.value })}
                          className="h-8 w-32 text-xs"
                        />
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-2">
                          <Input
                            value={it.icon}
                            onChange={(e) => updateRow(idx, { icon: e.target.value })}
                            placeholder="/images/icons/icon-nav/xxx.webp  hoặc  https://cdn..."
                            className="h-8 w-72 text-xs"
                          />
                          <input
                            ref={(el) => {
                              fileInputRefs.current[idx] = el;
                            }}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleUpload(idx, f);
                              e.currentTarget.value = "";
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRefs.current[idx]?.click()}
                          >
                            <Upload className="mr-1 h-3.5 w-3.5" /> Upload
                          </Button>
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <Input
                          value={it.path}
                          onChange={(e) => updateRow(idx, { path: e.target.value })}
                          className="h-8 w-36 text-xs"
                          placeholder="/slots"
                        />
                      </td>
                      <td className="px-2 py-3">
                        <Button
                          type="button"
                          variant={it.enabled ? "default" : "outline"}
                          size="sm"
                          className="h-8"
                          onClick={() => updateRow(idx, { enabled: !it.enabled })}
                          title={it.enabled ? "Đang bật — click để tắt" : "Đang tắt — click để bật"}
                        >
                          {it.enabled ? (
                            <>
                              <Eye className="mr-1 h-3.5 w-3.5" /> Bật
                            </>
                          ) : (
                            <>
                              <EyeOff className="mr-1 h-3.5 w-3.5" /> Tắt
                            </>
                          )}
                        </Button>
                      </td>
                      <td className="px-2 py-3 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeRow(idx)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {!items.length && (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                        Chưa có item. Bấm "Thêm item" hoặc "Đặt lại mặc định".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
            <p className="mb-1 font-semibold text-foreground">Lưu ý</p>
            <ul className="list-disc space-y-1 pl-4">
              <li><b>Icon URL</b> hỗ trợ cả local (<code>/images/icons/icon-nav/…</code>, <code>/game-icons/…</code>) hoặc CDN (<code>https://…</code>).</li>
              <li>Upload sẽ lưu vào <code>backend/public/game-icons</code> và trả về URL <code>/game-icons/&lt;file&gt;</code>.</li>
              <li>Slug Key phải duy nhất, chỉ a-z, 0-9, dấu gạch. Sửa key sẽ cập nhật trên frontend ngay sau khi lưu.</li>
              <li>Backend cache 60s. Sau khi lưu, cache được tự động xoá; user mới load sẽ thấy ngay.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
