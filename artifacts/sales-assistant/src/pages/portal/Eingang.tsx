import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, MailOpen, Paperclip, Inbox, Download } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Message {
  id: number;
  subject: string;
  body: string;
  pdfFilename: string | null;
  hasPdf: boolean;
  readAt: string | null;
  createdAt: string;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " · " + d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

export default function Eingang() {
  const queryClient = useQueryClient();
  const [openId, setOpenId] = useState<number | null>(null);

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["customer-messages"],
    queryFn: async () => {
      const res = await fetch("/api/customer/messages", { credentials: "include" });
      if (!res.ok) throw new Error("Fehler beim Laden.");
      return res.json() as Promise<Message[]>;
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/customer/messages/${id}/read`, { method: "POST", credentials: "include" });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["customer-messages"] });
      void queryClient.invalidateQueries({ queryKey: ["customer-unread-count"] });
    },
  });

  function toggleOpen(msg: Message) {
    const newOpen = openId === msg.id ? null : msg.id;
    setOpenId(newOpen);
    if (newOpen !== null && !msg.readAt) markRead.mutate(msg.id);
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <Inbox className="w-6 h-6 text-amber-500" />
          Eingang
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Nachrichten von NIWE Weddings an euch.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Wird geladen…</p>
      ) : messages.length === 0 ? (
        <Card className="border-dashed border-gray-200">
          <CardContent className="py-10 text-center">
            <Mail className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Noch keine Nachrichten.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {messages.map((msg) => {
            const isOpen = openId === msg.id;
            const isUnread = !msg.readAt;
            return (
              <Card
                key={msg.id}
                className={cn(
                  "transition-shadow overflow-hidden",
                  isUnread ? "border-amber-300 bg-amber-50/30 shadow-sm" : "border-gray-200",
                )}
              >
                <button
                  onClick={() => toggleOpen(msg)}
                  className="w-full text-left p-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors"
                >
                  <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
                    isUnread ? "bg-amber-100" : "bg-gray-100"
                  )}>
                    {isUnread ? <Mail className="w-4 h-4 text-amber-600" /> : <MailOpen className="w-4 h-4 text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn(
                        "truncate text-sm",
                        isUnread ? "font-semibold text-gray-900" : "font-medium text-gray-700"
                      )}>
                        {msg.subject}
                      </p>
                      {msg.hasPdf && <Paperclip className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
                    </div>
                    {!isOpen && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">{msg.body}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 shrink-0 hidden sm:block">{formatDate(msg.createdAt)}</span>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-1 border-t border-gray-100 bg-white">
                    <p className="text-xs text-gray-400 mb-3 sm:hidden">{formatDate(msg.createdAt)}</p>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {msg.body}
                    </div>
                    {msg.hasPdf && (
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <a
                          href={`/api/customer/messages/${msg.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-amber-200 bg-amber-50 text-sm text-amber-700 hover:bg-amber-100 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          {msg.pdfFilename ?? "Anhang.pdf"}
                        </a>
                      </div>
                    )}
                    <div className="mt-3 flex justify-end">
                      <Button variant="ghost" size="sm" onClick={() => setOpenId(null)} className="text-xs text-gray-400">
                        Schließen
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
