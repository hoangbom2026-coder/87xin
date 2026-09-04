import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { Button } from "@game/ui/button";
import { Input } from "@game/ui/input";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed bottom-5 right-5 z-40">
      {open && (
        <div className="mb-3 w-80 overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-2xl">
          <div className="bg-gradient-to-r from-brand-600 via-brand-500 to-teal-500 px-4 py-2 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-5 rounded-md bg-white/20" />
                <p className="text-sm font-medium">Proficient AI</p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={() => setOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>
            <p className="text-xs/5 opacity-90">
              Ask anything. Instant answers, human fallback.
            </p>
          </div>
          <div className="max-h-60 space-y-3 overflow-y-auto p-3 text-sm">
            <div className="rounded-lg bg-muted p-2">
              Hi! How can I help today?
            </div>
            <div className="ml-auto max-w-[80%] rounded-lg bg-primary p-2 text-primary-foreground">
              Show me pricing.
            </div>
            <div className="rounded-lg bg-muted p-2">
              Our Pro plan is $49/mo. Want a demo?
            </div>
          </div>
          <div className="flex items-center gap-2 border-t p-2">
            <Input placeholder="Type a message" className="h-9" />
            <Button size="icon" className="h-9 w-9">
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      )}
      <Button
        size="icon"
        className="h-12 w-12 rounded-full bg-gradient-to-br from-brand-600 via-brand-500 to-teal-500 text-white shadow-xl"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open chat"
      >
        <MessageCircle className="size-6" />
      </Button>
    </div>
  );
}
