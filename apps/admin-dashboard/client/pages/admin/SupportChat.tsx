import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import { Badge } from "@game/ui/badge";
import { Button } from "@game/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@game/ui/card";
import { Input } from "@game/ui/input";
import { Label } from "@game/ui/label";
import { ScrollArea } from "@game/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@game/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@game/ui/select";
import { Textarea } from "@game/ui/textarea";
import { toast } from "@game/ui/use-toast";
import { getAdminToken } from "@/lib/adminAuth";
import {
  assignSupport,
  getSupportStats,
  listSupportConversations,
  listSupportMessages,
  markSupportRead,
  postSupportMessage,
  setSupportStatus,
  updateSupportMeta,
  type SupportConversation,
  type SupportMessage,
  type SupportStats,
} from "@/lib/api";
import { format } from "date-fns";
import {
  CheckCheck,
  CircleSlash,
  Inbox,
  Search,
  Send,
  Tag,
  UserCheck,
  UserCog,
  Smartphone,
  Settings2,
  ExternalLink,
  Smile,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

const tk = () => getAdminToken() || "";
const POLL_LIST_MS = 5000;
const POLL_MSG_MS = 3000;
const DEFAULT_QUICK_REPLIES = [
  "Xin chào, mình có thể hỗ trợ gì cho bạn?",
  "Mình đã ghi nhận yêu cầu và đang kiểm tra.",
  "Bạn vui lòng chờ 1-2 phút để mình xử lý giúp bạn.",
  "Vấn đề đã được xử lý, bạn kiểm tra lại giúp mình nhé.",
  "Cảm ơn bạn đã liên hệ CSKH.",
];
const EMOJIS = ["😀", "😁", "😂", "😊", "😍", "😎", "🙏", "👍", "🎯", "🔥", "💯", "✅"];

function StatusBadge({ status }: { status: SupportConversation["status"] }) {
  if (status === "open")
    return <Badge className="bg-emerald-600 hover:bg-emerald-600">Mới</Badge>;
  if (status === "pending")
    return <Badge className="bg-amber-500 text-black">Đang xử lý</Badge>;
  return <Badge variant="outline">Đã đóng</Badge>;
}

function fmtTime(d: string | Date) {
  try {
    return format(new Date(d), "dd/MM HH:mm");
  } catch {
    return "";
  }
}

function ConversationItem({
  conv,
  active,
  onClick,
}: {
  conv: SupportConversation;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "block w-full rounded-md border px-3 py-2 text-left transition hover:bg-accent " +
        (active ? "border-primary bg-accent" : "border-border")
      }
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-medium text-sm">
          {conv.username || "(không tên)"}
        </span>
        <StatusBadge status={conv.status} />
      </div>
      <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="truncate">
          {conv.lastMessageBy === "admin" ? "Bạn: " : ""}
          {conv.lastMessage || "—"}
        </span>
        <span className="shrink-0">{fmtTime(conv.lastMessageAt)}</span>
      </div>
      {conv.unreadByAdmin > 0 && (
        <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
          {conv.unreadByAdmin} mới
        </div>
      )}
      {conv.assignedAdminName && (
        <div className="mt-1 flex items-center gap-1 text-[10px] text-sky-500">
          <UserCog className="size-3" />
          {conv.assignedAdminName}
        </div>
      )}
    </button>
  );
}

function MessageBubble({ msg }: { msg: SupportMessage }) {
  const isAdmin = msg.senderRole === "admin";
  const isSystem = msg.senderRole === "system";

  if (isSystem) {
    return (
      <div className="mx-auto max-w-md rounded-md bg-muted px-3 py-1.5 text-center text-xs text-muted-foreground">
        {msg.text}
      </div>
    );
  }

  return (
    <div className={"flex " + (isAdmin ? "justify-end" : "justify-start")}>
      <div
        className={
          "max-w-[78%] rounded-lg px-3 py-2 text-sm shadow-sm " +
          (isAdmin
            ? "rounded-br-sm bg-primary text-primary-foreground"
            : "rounded-bl-sm bg-muted")
        }
      >
        <div className="mb-0.5 text-[10px] font-semibold opacity-80">
          {msg.senderName || (isAdmin ? "Admin" : "User")}
        </div>
        <div className="whitespace-pre-wrap break-words leading-snug">
          {msg.text}
        </div>
        <div className="mt-1 text-[10px] opacity-70">
          {fmtTime(msg.createdAt)}
        </div>
      </div>
    </div>
  );
}

export default function SupportChatPage() {
  const [stats, setStats] = useState<SupportStats | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [keyword, setKeyword] = useState("");

  const [convs, setConvs] = useState<SupportConversation[]>([]);
  const [convLoading, setConvLoading] = useState(false);

  const [activeId, setActiveId] = useState<string | null>(null);
  const active = useMemo(
    () => convs.find((c) => (c.id || c._id) === activeId) ?? null,
    [convs, activeId],
  );

  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const [tagsInput, setTagsInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [quickReplyRaw, setQuickReplyRaw] = useState(DEFAULT_QUICK_REPLIES.join("\n"));
  const [quickReplies, setQuickReplies] = useState<string[]>(DEFAULT_QUICK_REPLIES);
  const [showEmoji, setShowEmoji] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function loadStats() {
    try {
      setStats(await getSupportStats(tk()));
    } catch {}
  }

  async function loadConversations() {
    setConvLoading(true);
    try {
      const r = await listSupportConversations(
        { status: statusFilter, keyword, limit: 60 },
        tk(),
      );
      setConvs(r.items);
      if (!activeId && r.items.length) setActiveId(r.items[0].id || r.items[0]._id || null);
    } catch (e) {
      toast({
        title: "Lỗi tải hội thoại",
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
    } finally {
      setConvLoading(false);
    }
  }

  async function loadMessages(convId: string, isInitial = false) {
    if (isInitial) setMsgLoading(true);
    try {
      const r = await listSupportMessages(convId, { limit: 200 }, tk());
      setMessages(r.items);
    } catch (e) {
      if (isInitial)
        toast({
          title: "Lỗi tải tin nhắn",
          description: e instanceof Error ? e.message : "",
          variant: "destructive",
        });
    } finally {
      if (isInitial) setMsgLoading(false);
    }
  }

  useEffect(() => {
    loadStats();
    loadConversations();
    const t = setInterval(() => {
      loadStats();
      loadConversations();
    }, POLL_LIST_MS);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, keyword]);

  useEffect(() => {
    if (!activeId) return;
    loadMessages(activeId, true);
    setTagsInput((active?.tags || []).join(", "));
    setNoteInput(active?.internalNote || "");
    markSupportRead(activeId, tk()).catch(() => undefined);
    const t = setInterval(() => {
      loadMessages(activeId);
      markSupportRead(activeId, tk()).catch(() => undefined);
    }, POLL_MSG_MS);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function send() {
    if (!activeId || !draft.trim() || sending) return;
    setSending(true);
    try {
      await postSupportMessage(activeId, draft.trim(), tk());
      setDraft("");
      await loadMessages(activeId);
      await loadConversations();
    } catch (e) {
      toast({
        title: "Gửi thất bại",
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  }

  async function changeStatus(s: "open" | "pending" | "closed") {
    if (!activeId) return;
    await setSupportStatus(activeId, s, tk());
    await loadConversations();
  }

  async function takeOrRelease(take: boolean) {
    if (!activeId) return;
    await assignSupport(activeId, take, tk());
    await loadConversations();
  }

  async function saveMeta() {
    if (!activeId) return;
    const tags = tagsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    await updateSupportMeta(activeId, { tags, internalNote: noteInput }, tk());
    toast({ title: "Đã lưu meta" });
    await loadConversations();
  }

  const groupedConvs = useMemo(() => {
    const open = convs.filter((c) => c.status === "open");
    const pending = convs.filter((c) => c.status === "pending");
    const closed = convs.filter((c) => c.status === "closed");
    return [
      { key: "open", label: "Tin nhắn mới", items: open },
      { key: "pending", label: "Đã trả lời", items: pending },
      { key: "closed", label: "Đóng", items: closed },
    ];
  }, [convs]);

  function applyQuickRepliesFromRaw() {
    const rows = quickReplyRaw
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 30);
    setQuickReplies(rows.length ? rows : DEFAULT_QUICK_REPLIES);
    setSettingsOpen(false);
    toast({ title: "Đã cập nhật quick replies" });
  }

  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <div className="flex h-[calc(100vh-100px)] flex-col gap-3 p-2 md:p-3">
          <div className="rounded-lg border bg-gradient-to-br from-slate-50 to-slate-100 p-4 lg:hidden">
            <div className="mb-2 inline-flex rounded-md bg-primary/10 p-2 text-primary">
              <Smartphone className="size-4" />
            </div>
            <h3 className="text-sm font-semibold">
              Trang Messages hiện chưa hỗ trợ đầy đủ trên thiết bị di động.
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Vui lòng truy cập trang Tickets để theo dõi và xử lý yêu cầu.
            </p>
            <Button asChild className="mt-3" size="sm">
              <Link to="/admin/tickets">
                <ExternalLink className="mr-1 size-4" />
                Đi tới trang Tickets
              </Link>
            </Button>
          </div>

          {/* Stats strip */}
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="mr-2 text-lg font-semibold">CSKH · Live Chat</h1>
            <Badge variant="secondary" className="gap-1">
              <Inbox className="size-3" /> {stats?.open ?? 0} mới
            </Badge>
            <Badge className="gap-1 bg-amber-500 text-black hover:bg-amber-500">
              {stats?.pending ?? 0} đang xử lý
            </Badge>
            <Badge variant="outline" className="gap-1">
              {stats?.closed ?? 0} đã đóng
            </Badge>
            {(stats?.totalUnread ?? 0) > 0 && (
              <Badge className="bg-red-500 hover:bg-red-500">
                {stats?.totalUnread} chưa đọc
              </Badge>
            )}
            <div className="ml-auto text-xs text-muted-foreground">
              <Link to="/admin/tickets" className="underline">
                Hệ thống Tickets (asynchronous)
              </Link>
            </div>
          </div>

          {/* 3-panel layout */}
          <div className="hidden min-h-0 flex-1 gap-3 lg:grid lg:grid-cols-[300px_1fr_280px]">
            {/* LEFT: Conversation list */}
            <Card className="flex min-h-0 flex-col">
              <CardHeader className="space-y-2 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Messages</CardTitle>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-7"
                    onClick={() => setSettingsOpen(true)}
                    title="Cài đặt chat"
                  >
                    <Settings2 className="size-4" />
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  Hiển thị {convs.length} / {convs.length}
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 size-3.5 text-muted-foreground" />
                    <Input
                      className="h-8 pl-7 text-xs"
                      placeholder="Tìm…"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-8 w-[110px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="open">Mới</SelectItem>
                      <SelectItem value="pending">Đang xử lý</SelectItem>
                      <SelectItem value="closed">Đã đóng</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="min-h-0 flex-1 px-2">
                <ScrollArea className="h-full pr-2">
                  <div className="space-y-3">
                    {groupedConvs.map((group) => (
                      <div key={group.key}>
                        <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {group.label}
                        </p>
                        <div className="space-y-1.5">
                          {group.items.map((c) => (
                            <ConversationItem
                              key={c.id || c._id}
                              conv={c}
                              active={activeId === (c.id || c._id)}
                              onClick={() => setActiveId(c.id || c._id || null)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                    {!convs.length && !convLoading && (
                      <div className="py-10 text-center text-xs text-muted-foreground">
                        Không có hội thoại
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* CENTER: Message thread */}
            <Card className="flex min-h-0 flex-col">
              {!active ? (
                <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                  Chọn một hội thoại để xem
                </div>
              ) : (
                <>
                  <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 border-b py-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-semibold">
                          {active.username || "(không tên)"}
                        </span>
                        <StatusBadge status={active.status} />
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        ID: <code>{active.id || active._id}</code>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => takeOrRelease(true)}
                        title="Nhận xử lý"
                      >
                        <UserCheck className="mr-1 size-4" />
                        {active.assignedAdminId ? "Nhận lại" : "Nhận"}
                      </Button>
                      {active.status !== "closed" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => changeStatus("closed")}
                        >
                          <CircleSlash className="mr-1 size-4" />
                          Đóng
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => changeStatus("open")}
                        >
                          Mở lại
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => activeId && markSupportRead(activeId, tk())}
                      >
                        <CheckCheck className="mr-1 size-4" />
                        Đã đọc
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex min-h-0 flex-1 flex-col gap-2 p-3">
                    <div
                      ref={scrollRef}
                      className="flex-1 space-y-2 overflow-y-auto pr-1"
                    >
                      {msgLoading && (
                        <div className="text-center text-xs text-muted-foreground">
                          Đang tải…
                        </div>
                      )}
                      {messages.map((m) => (
                        <MessageBubble key={m.id || m._id} msg={m} />
                      ))}
                      {!msgLoading && !messages.length && (
                        <div className="py-10 text-center text-xs text-muted-foreground">
                          Chưa có tin nhắn nào
                        </div>
                      )}
                    </div>

                    {active.status === "closed" ? (
                      <div className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
                        Hội thoại đã đóng — nhấn &ldquo;Mở lại&rdquo; để gửi tiếp.
                      </div>
                    ) : (
                      <div className="flex items-end gap-2 border-t pt-2">
                        <div className="relative flex-1">
                          <Textarea
                          rows={2}
                          placeholder="Trả lời khách… (Ctrl+Enter để gửi)"
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                              e.preventDefault();
                              send();
                            }
                          }}
                          className="min-h-[44px] resize-none"
                        />
                          {draft.trim().length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {quickReplies
                                .filter((q) => q.toLowerCase().includes(draft.toLowerCase()))
                                .slice(0, 4)
                                .map((q) => (
                                  <button
                                    key={q}
                                    type="button"
                                    onClick={() => setDraft(q)}
                                    className="rounded-md border bg-background px-2 py-0.5 text-[10px] hover:bg-accent"
                                  >
                                    {q}
                                  </button>
                                ))}
                            </div>
                          )}
                          {showEmoji && (
                            <div className="absolute bottom-full right-0 mb-2 grid grid-cols-6 gap-1 rounded-md border bg-background p-2 shadow">
                              {EMOJIS.map((e) => (
                                <button
                                  key={e}
                                  type="button"
                                  className="rounded p-1 hover:bg-accent"
                                  onClick={() => setDraft((prev) => `${prev}${e}`)}
                                >
                                  {e}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setShowEmoji((x) => !x)}
                        >
                          <Smile className="size-4" />
                        </Button>
                        <Button
                          onClick={send}
                          disabled={!draft.trim() || sending}
                          size="sm"
                        >
                          <Send className="mr-1 size-4" />
                          Gửi
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </>
              )}
            </Card>

            {/* RIGHT: User info / meta */}
            <Card className="hidden min-h-0 flex-col lg:flex">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Thông tin & Ghi chú</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 overflow-y-auto text-sm">
                {active ? (
                  <>
                    <div className="rounded-md border p-2 text-xs">
                      <div className="text-muted-foreground">Khách hàng</div>
                      <div className="font-medium">
                        {active.username || "(không tên)"}
                      </div>
                      <div className="mt-1 text-[10px] text-muted-foreground">
                        User ID: <code>{active.userId}</code>
                      </div>
                      <Link
                        to={`/players/${active.userId}`}
                        className="mt-1 inline-block text-xs text-primary underline"
                      >
                        Xem hồ sơ player →
                      </Link>
                    </div>
                    <div className="rounded-md border p-2 text-xs">
                      <div className="text-muted-foreground">Phụ trách</div>
                      <div>
                        {active.assignedAdminName ? (
                          <span className="text-sky-500">
                            {active.assignedAdminName}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Chưa ai nhận</span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">
                        <Tag className="mr-1 inline size-3" />
                        Tags (phân cách dấu phẩy)
                      </Label>
                      <Input
                        value={tagsInput}
                        onChange={(e) => setTagsInput(e.target.value)}
                        placeholder="vd: VIP, khiếu nại nạp"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Ghi chú nội bộ</Label>
                      <Textarea
                        rows={5}
                        value={noteInput}
                        onChange={(e) => setNoteInput(e.target.value)}
                        placeholder="Note cho admin khác đọc…"
                        className="text-xs"
                      />
                    </div>
                    <Button size="sm" className="w-full" onClick={saveMeta}>
                      Lưu meta
                    </Button>
                    <div className="rounded-md border p-2 text-xs text-muted-foreground">
                      Tin cuối:{" "}
                      <span className="text-foreground">
                        {fmtTime(active.lastMessageAt)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    Chọn một hội thoại để xem chi tiết
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cài đặt Messages</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Label>Quick Replies (mỗi dòng 1 câu)</Label>
              <Textarea
                rows={8}
                value={quickReplyRaw}
                onChange={(e) => setQuickReplyRaw(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Dùng để gợi ý trả lời nhanh khi chat.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSettingsOpen(false)}>
                Hủy
              </Button>
              <Button onClick={applyQuickRepliesFromRaw}>Lưu</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </RequireSuperAdmin>
  );
}
