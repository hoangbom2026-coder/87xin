import RequireSuperAdmin from '@/components/auth/RequireSuperAdmin';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import React from 'react';
import { toast } from '@/components/ui/use-toast';
import { listDailyChallengesApi, createDailyChallengeApi, updateDailyChallengeApi, deleteDailyChallengeApi, DailyChallengeItem } from '@/lib/api';
import { getAdminToken } from '@/lib/adminAuth';

const token = () => getAdminToken() || '';
const API_BASE = '/api';
const ASSET_HOST = API_BASE.replace(/\/+api\/?$/, '');

export default function DailyChallenges() {
  const [rows, setRows] = React.useState<DailyChallengeItem[]>([]);
  const [loading, setLoading] = React.useState(false);

  async function load() {
    setLoading(true);
    try { const data = await listDailyChallengesApi(token()); setRows(data || []); } 
    catch (e: any) { toast({ title: 'Load failed', description: e?.message || '', variant: 'destructive' }); }
    finally { setLoading(false); }
  }

  React.useEffect(() => { load(); }, []);

  async function deleteRow(id: string) {
    if(!confirm('Delete?')) return;
    try { await deleteDailyChallengeApi(id, token()); toast({ title: 'Deleted' }); await load(); }
    catch (e: any) { toast({ title: 'Delete failed', description: e?.message || '', variant: 'destructive' }); }
  }

  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <div className='flex items-center justify-between'>
          <h1 className='text-lg font-semibold md:text-xl'>Daily Challenges</h1>
          <Button onClick={load}>Refresh</Button>
        </div>
        <Card className='mt-4'>
          <CardHeader><CardTitle className='text-base'>Manage Battle/Challenges</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Prize</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r._id}>
                    <TableCell><img src={`${ASSET_HOST}/${r.image}`} className='h-12 w-20 object-cover rounded' /></TableCell>
                    <TableCell>{r.title}</TableCell>
                    <TableCell>{r.prize}</TableCell>
                    <TableCell><Switch checked={r.status === 'active'} /></TableCell>
                    <TableCell><Button size='sm' variant='destructive' onClick={()=>deleteRow(r._id)}>Delete</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </AdminLayout>
    </RequireSuperAdmin>
  );
}