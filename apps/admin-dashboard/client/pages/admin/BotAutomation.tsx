import RequireSuperAdmin from "@/components/auth/RequireSuperAdmin";
import AdminLayout from "@/components/layout/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@game/ui/card";
import { Button } from "@game/ui/button";
import { Input } from "@game/ui/input";
import { Label } from "@game/ui/label";
import { Switch } from "@game/ui/switch";
import { Textarea } from "@game/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@game/ui/tabs";
import { toast } from "@game/ui/use-toast";
import { getAdminToken } from "@/lib/adminAuth";
import { getBotAutomation, patchBotAutomation } from "@/lib/api";
import * as React from "react";
import { Save } from "lucide-react";

const token = () => getAdminToken() || "";

type BetForm = {
  enabled: boolean;
  spawnIntervalSec: number;
  privateBetChance: number;
  privateProfileChance: number;
  minGamesPerBot: number;
  maxGamesPerBot: number;
  minDelayBetweenGamesSec: number;
  maxDelayBetweenGamesSec: number;
};

type ChatForm = {
  enabled: boolean;
  messageIntervalSec: number;
  randomDelaySec: number;
  channels: string;
  messages: string;
};

const defaultBet: BetForm = {
  enabled: false,
  spawnIntervalSec: 10,
  privateBetChance: 20,
  privateProfileChance: 20,
  minGamesPerBot: 20,
  maxGamesPerBot: 50,
  minDelayBetweenGamesSec: 1,
  maxDelayBetweenGamesSec: 30,
};

const defaultChat: ChatForm = {
  enabled: false,
  messageIntervalSec: 15,
  randomDelaySec: 15,
  channels: "casino_en casino_pt-br sport_en",
  messages: "Hello\nhi\nWOW",
};

export default function BotAutomation() {
  const [loading, setLoading] = React.useState(false);
  const [savingBet, setSavingBet] = React.useState(false);
  const [savingChat, setSavingChat] = React.useState(false);
  const [bet, setBet] = React.useState<BetForm>(defaultBet);
  const [chat, setChat] = React.useState<ChatForm>(defaultChat);

  async function load() {
    const t = token();
    if (!t) return;
    setLoading(true);
    try {
      const doc = await getBotAutomation(t);
      if (doc?.bet) setBet({ ...defaultBet, ...doc.bet });
      if (doc?.chat) setChat({ ...defaultChat, ...doc.chat });
    } catch (e: any) {
      toast({
        title: "Không tải được cấu hình bot",
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

  async function saveBetOnly() {
    const t = token();
    if (!t) return;
    setSavingBet(true);
    try {
      await patchBotAutomation({ bet }, t);
      toast({ title: "Đã lưu Bot cá cược", description: "Runner đã được áp dụng." });
      await load();
    } catch (e: any) {
      toast({
        title: "Lưu thất bại",
        description: e?.message || "",
        variant: "destructive",
      });
    } finally {
      setSavingBet(false);
    }
  }

  async function saveChatOnly() {
    const t = token();
    if (!t) return;
    setSavingChat(true);
    try {
      await patchBotAutomation({ chat }, t);
      toast({ title: "Đã lưu Bot chat", description: "Runner đã được áp dụng." });
      await load();
    } catch (e: any) {
      toast({
        title: "Lưu thất bại",
        description: e?.message || "",
        variant: "destructive",
      });
    } finally {
      setSavingChat(false);
    }
  }

  return (
    <RequireSuperAdmin>
      <AdminLayout>
        <AdminPageHeader
          title="Bot tự động"
          description="Cấu hình bot giả lập cược (recent-bet) và tin chat (socket bot-chat)."
        />

        <Tabs defaultValue="bet" className="w-full max-w-3xl">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bet">Cá cược</TabsTrigger>
            <TabsTrigger value="chat">Trò chuyện</TabsTrigger>
          </TabsList>

          <TabsContent value="bet" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Bot cá cược</CardTitle>
                <CardDescription>
                  Khi bật, cron random mặc định (mỗi giây) sẽ tắt; bot tạo session theo khoảng X giây, mỗi session chơi ngẫu
                  nhiên trong khoảng min–max trận.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="bet-en">Bật bot cá cược</Label>
                  <Switch
                    id="bet-en"
                    checked={bet.enabled}
                    onCheckedChange={(v) => setBet((b) => ({ ...b, enabled: v }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Tạo bot mới sau mỗi X giây</Label>
                  <Input
                    type="number"
                    min={1}
                    value={bet.spawnIntervalSec}
                    onChange={(e) =>
                      setBet((b) => ({ ...b, spawnIntervalSec: Number(e.target.value) || 1 }))
                    }
                  />
                  <p className="text-muted-foreground text-sm">Bot mới sẽ được tạo cứ sau X giây.</p>
                </div>
                <div className="grid gap-2">
                  <Label>Xác suất cá cược riêng (0 – 100)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={bet.privateBetChance}
                    onChange={(e) =>
                      setBet((b) => ({ ...b, privateBetChance: Number(e.target.value) }))
                    }
                  />
                  <p className="text-muted-foreground text-sm">
                    Gắn cờ privateBet trên payload recent-bet (UI có thể dùng để làm mờ).
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label>Xác suất hồ sơ riêng tư (0 – 100)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={bet.privateProfileChance}
                    onChange={(e) =>
                      setBet((b) => ({ ...b, privateProfileChance: Number(e.target.value) }))
                    }
                  />
                  <p className="text-muted-foreground text-sm">
                    Xác suất hiển thị username ẩn danh (Hidden) thay vì tên giả.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Số trận tối thiểu / bot</Label>
                    <Input
                      type="number"
                      min={1}
                      value={bet.minGamesPerBot}
                      onChange={(e) =>
                        setBet((b) => ({ ...b, minGamesPerBot: Number(e.target.value) || 1 }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Số trận tối đa / bot</Label>
                    <Input
                      type="number"
                      min={1}
                      value={bet.maxGamesPerBot}
                      onChange={(e) =>
                        setBet((b) => ({ ...b, maxGamesPerBot: Number(e.target.value) || 1 }))
                      }
                    />
                  </div>
                </div>
                <p className="text-muted-foreground text-sm">Bot sẽ chơi ngẫu nhiên trong khoảng min–max trận.</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Chờ tối thiểu giữa các trận (giây)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={bet.minDelayBetweenGamesSec}
                      onChange={(e) =>
                        setBet((b) => ({
                          ...b,
                          minDelayBetweenGamesSec: Number(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Chờ tối đa giữa các trận (giây)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={bet.maxDelayBetweenGamesSec}
                      onChange={(e) =>
                        setBet((b) => ({
                          ...b,
                          maxDelayBetweenGamesSec: Number(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                </div>
                <Button disabled={loading || savingBet} onClick={() => saveBetOnly()}>
                  <Save className="mr-2 h-4 w-4" />
                  Lưu cấu hình cá cược
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Bot chat</CardTitle>
                <CardDescription>
                  Gửi socket event <code className="text-xs">bot-chat</code> với kênh và nội dung ngẫu nhiên; frontend cần
                  listener nếu muốn hiển thị.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="chat-en">Bật bot chat</Label>
                  <Switch
                    id="chat-en"
                    checked={chat.enabled}
                    onCheckedChange={(v) => setChat((c) => ({ ...c, enabled: v }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Khoảng thời gian giữa các tin (giây)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={chat.messageIntervalSec}
                    onChange={(e) =>
                      setChat((c) => ({
                        ...c,
                        messageIntervalSec: Number(e.target.value) || 1,
                      }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Độ trễ ngẫu nhiên thêm (giây)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={chat.randomDelaySec}
                    onChange={(e) =>
                      setChat((c) => ({
                        ...c,
                        randomDelaySec: Number(e.target.value) || 0,
                      }))
                    }
                  />
                  <p className="text-muted-foreground text-sm">
                    Thời gian chờ thực tế = khoảng cơ bản + ngẫu nhiên 0…X giây.
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label>Kênh chatbot</Label>
                  <Input
                    value={chat.channels}
                    onChange={(e) => setChat((c) => ({ ...c, channels: e.target.value }))}
                    placeholder="casino_en casino_pt-br sport_en"
                  />
                  <p className="text-muted-foreground text-sm">Cách nhau bằng khoảng trắng hoặc dấu phẩy.</p>
                </div>
                <div className="grid gap-2">
                  <Label>Tin nhắn (mỗi dòng hoặc /)</Label>
                  <Textarea
                    rows={6}
                    value={chat.messages}
                    onChange={(e) => setChat((c) => ({ ...c, messages: e.target.value }))}
                    placeholder={"Hello\nhi\nWOW"}
                  />
                </div>
                <Button disabled={loading || savingChat} onClick={() => saveChatOnly()}>
                  <Save className="mr-2 h-4 w-4" />
                  Lưu cấu hình chat
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </AdminLayout>
    </RequireSuperAdmin>
  );
}
