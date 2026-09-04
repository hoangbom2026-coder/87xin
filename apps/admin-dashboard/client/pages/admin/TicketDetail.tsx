import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@game/ui/card";
import { Button } from "@game/ui/button";
import { Textarea } from "@game/ui/textarea";
import { Badge } from "@game/ui/badge";
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "@game/ui/use-toast";
import { getTicketDetail, replyTicketApi } from "@/lib/api";
import { getAdminToken } from "@/lib/adminAuth";
import { format } from "date-fns";

const token = () => getAdminToken() || "";

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = React.useState<any>(null);
  const [message, setMessage] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function load() {
    if (!id) return;
    try {
      const data = await getTicketDetail(id, token());
      setTicket(data);
    } catch (e: any) {
      toast({ title: "Load failed", variant: "destructive" });
    }
  }

  React.useEffect(() => { load(); }, [id]);

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !message) return;
    setLoading(true);
    try {
      await replyTicketApi(id, message, token());
      toast({ title: "Replied successfully" });
      setMessage("");
      await load();
    } catch (e: any) {
      toast({ title: "Failed to reply", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  if (!ticket) return <AdminLayout><div>Loading...</div></AdminLayout>;

  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={()=>navigate('/admin/tickets')}>Quay lại</Button>
          <h1 className="text-xl font-bold">Ticket: {ticket.subject}</h1>
          <Badge variant="outline">{ticket.status}</Badge>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Original message */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="font-bold">{ticket.userId?.username}</div>
                <div className="text-xs text-muted-foreground">{format(new Date(ticket.createdAt), 'dd/MM/yyyy HH:mm')}</div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line">{ticket.message}</p>
              </CardContent>
            </Card>

            {/* Replies */}
            {ticket.replies.map((reply: any, idx: number) => (
              <Card key={idx} className={reply.adminId ? "border-primary/50 bg-primary/5" : ""}>
                <CardHeader className="flex flex-row items-center justify-between py-2">
                  <div className="font-bold text-sm">
                    {reply.adminId ? "Admin Support" : ticket.userId?.username}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {format(new Date(reply.createdAt), 'dd/MM/yyyy HH:mm')}
                  </div>
                </CardHeader>
                <CardContent className="py-2">
                  <p className="text-sm whitespace-pre-line">{reply.message}</p>
                </CardContent>
              </Card>
            ))}

            {/* Reply Form */}
            {ticket.status !== 'closed' && (
              <Card>
                <CardContent className="pt-6">
                  <form onSubmit={handleReply} className="space-y-4">
                    <Textarea 
                      placeholder="Nhập nội dung phản hồi..." 
                      value={message}
                      onChange={(e)=>setMessage(e.target.value)}
                      rows={5}
                    />
                    <Button type="submit" disabled={loading}>
                      {loading ? "Đang gửi..." : "Gửi phản hồi"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-sm uppercase text-muted-foreground">Thông tin người dùng</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-2">
                <div><strong>Username:</strong> {ticket.userId?.username}</div>
                <div><strong>Email:</strong> {ticket.userId?.email}</div>
                <div><strong>Độ ưu tiên:</strong> <Badge variant="secondary">{ticket.priority}</Badge></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminLayout>
    </RequireSuperAdmin>
  );
}
