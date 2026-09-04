import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@game/ui/card";
import { Button } from "@game/ui/button";
import { Input } from "@game/ui/input";
import { Switch } from "@game/ui/switch";
import { Textarea } from "@game/ui/textarea";
import React from "react";
import { toast } from "@game/ui/use-toast";
import { getContentBlocks, createContentBlock, updateContentBlock, deleteContentBlock } from "@/lib/api";
import { getAdminToken } from "@/lib/adminAuth";

import {
  Table as UITable,
  TableBody as UITableBody,
  TableCell as UITableCell,
  TableHead as UITableHead,
  TableHeader as UITableHeader,
  TableRow as UITableRow,
} from "@game/ui/table";

const token = () => getAdminToken() || "";

type ContentBlock = {
  _id: string;
  key: string;
  value: any;
  description: string;
  order: number;
  isVisible: boolean;
  isMaintenance: boolean;
};

export function ContentBlocksPanel() {
  const [rows, setRows] = React.useState<ContentBlock[]>([]);
  const [loading, setLoading] = React.useState(false);

  const [createData, setCreateData] = React.useState({
    key: "",
    value: "",
    description: "",
    order: 0,
    isVisible: true,
    isMaintenance: false,
  });

  async function load() {
    setLoading(true);
    try {
      const data = await getContentBlocks(token());
      setRows((data as any) || []);
    } catch (e: any) {
      toast({ title: "Load failed", description: e?.message || "", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); }, []);

  function updateRow(idx: number, patch: Partial<ContentBlock>) {
    setRows((prev) => prev.map((r, i) => (i === idx ? ({ ...r, ...patch } as ContentBlock) : r)));
  }

  async function saveRow(idx: number) {
    const row = rows[idx];
    try {
      await updateContentBlock(row._id, row, token());
      toast({ title: "Saved" });
      await load();
    } catch (e: any) {
      toast({ title: "Save failed", description: e?.message || "", variant: "destructive" });
    }
  }

  async function deleteRow(id: string) {
    try {
      await deleteContentBlock(id, token());
      toast({ title: "Deleted" });
      await load();
    } catch (e: any) {
      toast({ title: "Delete failed", description: e?.message || "", variant: "destructive" });
    }
  }

  async function createBlock(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createContentBlock(createData, token());
      toast({ title: "Block created" });
      setCreateData({ key: "", value: "", description: "", order: 0, isVisible: true, isMaintenance: false });
      await load();
    } catch (e: any) {
      toast({ title: "Create failed", description: e?.message || "", variant: "destructive" });
    }
  }

  return (
    <>
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold md:text-xl">Content Blocks (CMS)</h1>
          <Button variant="outline" onClick={load} disabled={loading}>{loading?"Loading...":"Refresh"}</Button>
        </div>

        <Card className="mt-4">
          <CardHeader><CardTitle className="text-base">Create Content Block</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={createBlock} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input placeholder="Key (e.g. home_hero_text)" value={createData.key} onChange={(e)=>setCreateData({...createData, key:e.target.value})} required />
              <Input placeholder="Description" value={createData.description} onChange={(e)=>setCreateData({...createData, description:e.target.value})} />
              <Input type="number" placeholder="Order" value={createData.order} onChange={(e)=>setCreateData({...createData, order:Number(e.target.value)||0})} />
              <div className="md:col-span-3">
                <Textarea placeholder="Value (Text, HTML, or JSON)" value={createData.value} onChange={(e)=>setCreateData({...createData, value:e.target.value})} required />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2"><span className="text-xs">Visible</span><Switch checked={createData.isVisible} onCheckedChange={(v)=>setCreateData({...createData, isVisible:v})} /></div>
                <div className="flex items-center gap-2"><span className="text-xs">Maintenance</span><Switch checked={createData.isMaintenance} onCheckedChange={(v)=>setCreateData({...createData, isMaintenance:v})} /></div>
              </div>
              <div className="md:col-span-3"><Button type="submit">Create</Button></div>
            </form>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader><CardTitle className="text-base">Existing Blocks</CardTitle></CardHeader>
          <CardContent>
            <UITable>
              <UITableHeader>
                <UITableRow>
                  <UITableHead>Key / Description</UITableHead>
                  <UITableHead>Value</UITableHead>
                  <UITableHead>Order</UITableHead>
                  <UITableHead>Status</UITableHead>
                  <UITableHead>Actions</UITableHead>
                </UITableRow>
              </UITableHeader>
              <UITableBody>
                {rows.map((r, idx) => (
                  <UITableRow key={r._id}>
                    <UITableCell className="min-w-48">
                      <div className="font-bold">{r.key}</div>
                      <Input className="mt-1 text-xs" value={r.description} onChange={(e)=>updateRow(idx,{description:e.target.value})} />
                    </UITableCell>
                    <UITableCell className="min-w-64">
                      <Textarea value={typeof r.value === 'string' ? r.value : JSON.stringify(r.value)} onChange={(e)=>updateRow(idx,{value:e.target.value})} />
                    </UITableCell>
                    <UITableCell>
                      <Input type="number" className="w-20" value={r.order} onChange={(e)=>updateRow(idx,{order:Number(e.target.value)||0})} />
                    </UITableCell>
                    <UITableCell>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2"><span className="text-xs">Visible</span><Switch checked={r.isVisible} onCheckedChange={(v)=>updateRow(idx,{isVisible:v})} /></div>
                        <div className="flex items-center gap-2"><span className="text-xs">Maint.</span><Switch checked={r.isMaintenance} onCheckedChange={(v)=>updateRow(idx,{isMaintenance:v})} /></div>
                      </div>
                    </UITableCell>
                    <UITableCell>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={()=>saveRow(idx)}>Save</Button>
                        <Button size="sm" variant="destructive" onClick={()=>deleteRow(r._id)}>Delete</Button>
                      </div>
                    </UITableCell>
                  </UITableRow>
                ))}
              </UITableBody>
            </UITable>
          </CardContent>
        </Card>
    </>
  );
}

export default function ContentBlocks() {
  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <ContentBlocksPanel />
      </AdminLayout>
    </RequireSuperAdmin>
  );
}
