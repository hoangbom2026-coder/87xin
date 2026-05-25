"use client";

import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import React, { Suspense } from "react";
import { toast } from "@/components/ui/use-toast";
import {
  getHelpList,
  createHelpApi,
  updateHelpApi,
  deleteHelpBySlug,
} from "@/lib/api";
import { getAdminToken } from "@/lib/adminAuth";

// ✅ Lazy load ReactQuill so it only loads on client
const ReactQuill = React.lazy(() => import("react-quill-new"));
import "react-quill-new/dist/quill.snow.css";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Icon } from "@iconify/react";

const token = () => getAdminToken() || "";

type Help = {
  _id: string;
  slug?: string;
  lang?: string;
  icon?: string;
  title?: string;
  content?: string;
  status?: boolean;
};

const iconArray = [
  "icon-park-outline:help",
  "mdi:exclamation",
  "mdi:book-open-blank-variant-outline",
  "mdi:bank",
  "mdi:account-convert",
];

export default function AdminHelpCenter() {
  const [rows, setRows] = React.useState<Help[]>([]);
  const [loading, setLoading] = React.useState(false);

  const [lang, setLang] = React.useState("en");
  const [slug, setSlug] = React.useState("");
  const [icon, setIcon] = React.useState("icon-park-outline:help");
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");

  async function load() {
    setLoading(true);
    try {
      const data = await getHelpList();
      setRows((data as any) || []);
      toast({ title: "Help list loaded" });
    } catch (e: any) {
      toast({
        title: "Load failed",
        description: e?.message || "",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
  }, []);

  function updateRow(idx: number, patch: Partial<Help>) {
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? ({ ...r, ...patch } as Help) : r)),
    );
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createHelpApi({ lang, slug, icon, title, content }, token());
      toast({ title: "Help created" });
      setLang("en");
      setSlug("");
      setIcon("");
      setTitle("");
      setContent("");
      await load();
    } catch (e: any) {
      toast({
        title: "Create failed",
        description: e?.message || "",
        variant: "destructive",
      });
    }
  }

  async function save(idx: number) {
    const row = rows[idx];
    try {
      await updateHelpApi(
        row._id as any,
        {
          lang: row.lang,
          icon: row.icon,
          title: row.title,
          content: row.content,
          status: row.status,
        } as any,
        token(),
      );
      toast({ title: "Saved" });
      await load();
    } catch (e: any) {
      toast({
        title: "Save failed",
        description: e?.message || "",
        variant: "destructive",
      });
    }
  }

  async function remove(slug: string) {
    try {
      await deleteHelpBySlug(slug, token());
      toast({ title: "Deleted" });
      await load();
    } catch (e: any) {
      toast({
        title: "Delete failed",
        description: e?.message || "",
        variant: "destructive",
      });
    }
  }

  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <h1 className="text-lg font-semibold md:text-xl">Help Center</h1>
          <Button variant="outline" onClick={load} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </div>

        {/* Create Form */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Create Content</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={create}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3"
            >
              {/* Inputs auto-resize across breakpoints */}
              <Input
                placeholder="lang"
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                required
                className="w-full"
              />
              <Input
                placeholder="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                className="w-full"
              />
              <Input
                placeholder="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full"
              />
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Icon" />
                </SelectTrigger>
                <SelectContent>
                  {iconArray.map((icon) => (
                    <SelectItem key={icon} value={icon}>
                      <Icon icon={icon} fontSize={20} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Editor takes full width on all screens */}
              <div className="col-span-1 sm:col-span-2 md:col-span-4">
                <Suspense
                  fallback={
                    <div className="min-h-[150px] border rounded-md flex items-center justify-center text-sm text-muted-foreground">
                      Loading editor...
                    </div>
                  }
                >
                  <ReactQuill
                    theme="snow"
                    value={content}
                    onChange={setContent}
                    className="min-h-[200px] w-full rounded-md"
                  />
                </Suspense>
              </div>

              {/* Button is full width on mobile, auto on larger */}
              <div className="col-span-1 sm:col-span-2 md:col-span-4 flex justify-end">
                <Button type="submit" className="w-full sm:w-auto">
                  Create
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Articles Table */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Help Articles</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {/* Desktop table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lang</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Icon</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, idx) => (
                    <TableRow key={r._id}>
                      <TableCell className="min-w-24">
                        <Input
                          value={r.lang || ""}
                          onChange={(e) =>
                            updateRow(idx, { lang: e.target.value })
                          }
                        />
                      </TableCell>
                      <TableCell className="min-w-32 break-all">
                        {r.slug || ""}
                      </TableCell>
                      <TableCell className="min-w-48 break-words">
                        <Input
                          value={r.title || ""}
                          onChange={(e) =>
                            updateRow(idx, { title: e.target.value })
                          }
                        />
                      </TableCell>
                      <TableCell className="min-w-24 break-words">
                        <Select
                          value={r.icon}
                          onValueChange={(e) => {
                            console.log(e);
                            updateRow(idx, { icon: e });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Icon" />
                          </SelectTrigger>
                          <SelectContent>
                            {iconArray.map((icon) => (
                              <SelectItem key={icon} value={icon}>
                                <Icon icon={icon} fontSize={20} />
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="min-w-[400px]">
                        <Suspense fallback={<div>Loading editor...</div>}>
                          <ReactQuill
                            theme="snow"
                            value={r.content || ""}
                            onChange={(val) => updateRow(idx, { content: val })}
                            className="min-h-[120px]"
                          />
                        </Suspense>
                      </TableCell>
                      <TableCell className="min-w-12">
                        <input
                          type="checkbox"
                          checked={Boolean(r.status)}
                          onChange={(e) =>
                            updateRow(idx, { status: e.target.checked })
                          }
                        />
                      </TableCell>
                      <TableCell className="min-w-40">
                        <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
                          <Button size="sm" onClick={() => save(idx)}>
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => remove(r.slug || "")}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-sm text-muted-foreground"
                      >
                        No help content
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile list */}
            <div className="grid gap-3 md:hidden">
              {rows.map((r, idx) => (
                <div key={r._id} className="rounded-lg border p-3 grid gap-2">
                  <div className="text-xs text-muted-foreground">
                    {r.slug || ""}
                  </div>
                  <Input
                    value={r.lang || ""}
                    onChange={(e) => updateRow(idx, { lang: e.target.value })}
                    placeholder="lang"
                  />
                  <Input
                    value={r.title || ""}
                    onChange={(e) => updateRow(idx, { title: e.target.value })}
                    placeholder="title"
                  />
                  <Select
                    value={r.icon}
                    onValueChange={(e) => updateRow(idx, { icon: e })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Icon" />
                    </SelectTrigger>
                    <SelectContent>
                      {iconArray.map((icon) => (
                        <SelectItem key={icon} value={icon}>
                          <Icon icon={icon} fontSize={20} />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Suspense fallback={<div>Loading editor...</div>}>
                    <ReactQuill
                      theme="snow"
                      value={r.content || ""}
                      onChange={(val) => updateRow(idx, { content: val })}
                      className="min-h-[120px]"
                    />
                  </Suspense>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Active
                    </span>
                    <input
                      type="checkbox"
                      checked={Boolean(r.status)}
                      onChange={(e) =>
                        updateRow(idx, { status: e.target.checked })
                      }
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => save(idx)}
                      className="flex-1 sm:flex-none"
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => remove(r.slug || "")}
                      className="flex-1 sm:flex-none"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
              {rows.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  No help content
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </AdminLayout>
    </RequireSuperAdmin>
  );
}
