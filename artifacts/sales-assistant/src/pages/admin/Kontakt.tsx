import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, CalendarDays, Send, Check, X, Clock, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Thread {
  customerId: number;
  customerName: string;
  customerEmail: string;
  lastMessageBody: string | null;
  lastMessageAt: string | null;
  lastMessageSender: "customer" | "admin" | null;
  unread: number;
}

interface ChatMsg {
  id: number;
  sender: "customer" | "admin";
  body: string;
  adminId: number | null;
  adminName: string | null;
  adminHasAvatar: boolean;
  createdAt: string;
}

interface ApptAdmin {
  id: number;
  customerId: number;
  customerName: string;
  customerEmail: string;
  status: "pending" | "proposed_by_admin" | "accepted" | "declined_by_admin" | "declined_by_customer" | "cancelled";
  customerProposedAt: string | null;
  customerMessage: string | null;
  adminProposedAt: string | null;
  adminMessage: string | null;
  finalAt: string | null;
  createdAt: string;
}

function fmtDt(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "long", year: "numeric" }) +
    " · " +
    d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) +
    " Uhr"
  );
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

// ── Chat: thread list + conversation ────────────────────────────────────────
function ChatSection() {
  const [openCustomerId, setOpenCustomerId] = useState<number | null>(null);

  const { data: threads = [] } = useQuery<Thread[]>({
    queryKey: ["admin-chat-threads"],
    queryFn: async () => {
      const r = await fetch("/api/admin/chat/threads", { credentials: "include" });
      if (!r.ok) throw new Error("Fehler");
      return r.json() as Promise<Thread[]>;
    },
    refetchInterval: 10000,
  });

  if (openCustomerId !== null) {
    const t = threads.find((th) => th.customerId === openCustomerId);
    return <ChatConversation customerId={openCustomerId} customerName={t?.customerName ?? ""} onBack={() => setOpenCustomerId(null)} />;
  }

  return (
    <div className="space-y-2">
      {threads.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Noch keine Chat-Nachrichten von Kunden.
          </CardContent>
        </Card>
      ) : (
        threads.map((t) => (
          <Card
            key={t.customerId}
            onClick={() => setOpenCustomerId(t.customerId)}
            className={cn(
              "cursor-pointer hover:shadow-md transition-shadow",
              t.unread > 0 ? "border-amber-300 bg-amber-50/30" : "border-gray-200",
            )}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-semibold shrink-0">
                {t.customerName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm text-gray-900 truncate">{t.customerName}</p>
                  {t.unread > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                      {t.unread}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {t.lastMessageSender === "admin" ? "Du: " : ""}{t.lastMessageBody}
                </p>
              </div>
              {t.lastMessageAt && (
                <span className="text-[10px] text-gray-400 shrink-0">{fmtTime(t.lastMessageAt)}</span>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

function ChatConversation({ customerId, customerName, onBack }: { customerId: number; customerName: string; onBack: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data } = useQuery<{ customer: { name: string }; messages: ChatMsg[] }>({
    queryKey: ["admin-chat", customerId],
    queryFn: async () => {
      const r = await fetch(`/api/admin/chat/${customerId}`, { credentials: "include" });
      if (!r.ok) throw new Error("Fehler");
      return r.json();
    },
    refetchInterval: 5000,
  });

  const messages = data?.messages ?? [];

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length]);

  const send = useMutation({
    mutationFn: async (body: string) => {
      const r = await fetch(`/api/admin/chat/${customerId}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? "Fehler");
    },
    onSuccess: () => {
      setText("");
      void qc.invalidateQueries({ queryKey: ["admin-chat", customerId] });
      void qc.invalidateQueries({ queryKey: ["admin-chat-threads"] });
    },
    onError: (e: Error) => toast({ title: "Konnte nicht senden", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Zurück
        </Button>
        <h3 className="font-semibold">{data?.customer.name ?? customerName}</h3>
      </div>
      <Card className="border-gray-200 overflow-hidden">
        <div ref={scrollRef} className="h-[480px] overflow-y-auto p-4 bg-gray-50/50 space-y-3">
          {messages.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground mt-12">Noch keine Nachrichten.</p>
          ) : (
            messages.map((m) => {
              const fromAdmin = m.sender === "admin";
              const adminLabel = m.adminName ?? "NIWE Team";
              const initials = adminLabel.split(/\s+/).map((p) => p.charAt(0)).join("").slice(0, 2).toUpperCase();
              return (
                <div key={m.id} className={cn("flex items-end gap-2", fromAdmin ? "justify-end" : "justify-start")}>
                  {fromAdmin && (
                    <div className="w-7 h-7 rounded-full overflow-hidden bg-amber-100 text-amber-700 flex items-center justify-center text-[10px] font-semibold shrink-0 order-2">
                      {m.adminId && m.adminHasAvatar ? (
                        <img src={`/api/admin-avatars/${m.adminId}.jpg`} alt={adminLabel} className="w-full h-full object-cover" />
                      ) : (
                        <span>{initials}</span>
                      )}
                    </div>
                  )}
                  <div className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2 shadow-sm",
                    fromAdmin ? "bg-amber-500 text-white rounded-br-sm order-1" : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm",
                  )}>
                    {fromAdmin && (
                      <p className="text-[11px] font-semibold text-amber-100 mb-0.5">{adminLabel}</p>
                    )}
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.body}</p>
                    <p className={cn("text-[10px] mt-1", fromAdmin ? "text-amber-100" : "text-gray-400")}>{fmtTime(m.createdAt)}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); if (text.trim()) send.mutate(text.trim()); }}
          className="border-t border-gray-200 p-3 bg-white flex gap-2"
        >
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Antwort schreiben…" disabled={send.isPending} />
          <Button type="submit" disabled={!text.trim() || send.isPending} className="bg-amber-500 hover:bg-amber-600">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </Card>
    </div>
  );
}

// ── Appointments admin section ──────────────────────────────────────────────
function StatusBadge({ status }: { status: ApptAdmin["status"] }) {
  const map: Record<ApptAdmin["status"], { label: string; cls: string; icon: React.ReactNode }> = {
    pending:               { label: "Offen",                cls: "bg-amber-100 text-amber-800 border-amber-200",       icon: <Clock className="w-3 h-3" /> },
    proposed_by_admin:     { label: "Gegenvorschlag",       cls: "bg-blue-100 text-blue-800 border-blue-200",          icon: <AlertCircle className="w-3 h-3" /> },
    accepted:              { label: "Bestätigt",            cls: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: <CheckCircle2 className="w-3 h-3" /> },
    declined_by_admin:     { label: "Abgelehnt",            cls: "bg-gray-100 text-gray-600 border-gray-200",          icon: <X className="w-3 h-3" /> },
    declined_by_customer:  { label: "Kunde abgelehnt",      cls: "bg-gray-100 text-gray-600 border-gray-200",          icon: <X className="w-3 h-3" /> },
    cancelled:             { label: "Storniert",            cls: "bg-gray-100 text-gray-600 border-gray-200",          icon: <X className="w-3 h-3" /> },
  };
  const s = map[status];
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border", s.cls)}>
      {s.icon}{s.label}
    </span>
  );
}

function AppointmentsSection() {
  const { data: appts = [] } = useQuery<ApptAdmin[]>({
    queryKey: ["admin-appointments"],
    queryFn: async () => {
      const r = await fetch("/api/admin/appointments", { credentials: "include" });
      if (!r.ok) throw new Error("Fehler");
      return r.json() as Promise<ApptAdmin[]>;
    },
    refetchInterval: 15000,
  });

  if (appts.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Keine Terminanfragen vorhanden.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {appts.map((a) => <AdminApptCard key={a.id} appt={a} />)}
    </div>
  );
}

function AdminApptCard({ appt }: { appt: ApptAdmin }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showPropose, setShowPropose] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [msg, setMsg] = useState("");

  const action = useMutation({
    mutationFn: async (op: { kind: "accept" } | { kind: "propose" } | { kind: "decline" }) => {
      let url: string;
      let body: unknown = {};
      if (op.kind === "accept") {
        url = `/api/admin/appointments/${appt.id}/accept`;
      } else if (op.kind === "decline") {
        url = `/api/admin/appointments/${appt.id}/decline`;
        body = { message: msg.trim() || undefined };
      } else {
        if (!date || !time) throw new Error("Bitte Datum und Uhrzeit angeben.");
        url = `/api/admin/appointments/${appt.id}/propose`;
        body = { proposedAt: new Date(`${date}T${time}:00`).toISOString(), message: msg.trim() || undefined };
      }
      const r = await fetch(url, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? "Fehler");
    },
    onSuccess: (_d, vars) => {
      toast({
        title: vars.kind === "accept" ? "Termin angenommen" : vars.kind === "propose" ? "Gegenvorschlag gesendet" : "Termin abgelehnt",
      });
      setShowPropose(false);
      setDate(""); setTime(""); setMsg("");
      void qc.invalidateQueries({ queryKey: ["admin-appointments"] });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const canAct = appt.status === "pending" || appt.status === "proposed_by_admin";
  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <Card className="border-gray-200">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <p className="font-semibold text-sm text-gray-900">{appt.customerName}</p>
            <p className="text-xs text-gray-500">{appt.customerEmail}</p>
          </div>
          <StatusBadge status={appt.status} />
        </div>

        {appt.customerProposedAt && (
          <div className="text-sm">
            <span className="text-gray-500">Wunschtermin: </span>
            <span className="font-medium text-gray-900">{fmtDt(appt.customerProposedAt)}</span>
          </div>
        )}
        {appt.customerMessage && (
          <p className="text-xs text-gray-700 italic bg-gray-50 rounded-md px-3 py-2">„{appt.customerMessage}"</p>
        )}

        {appt.adminProposedAt && (
          <div className="text-sm">
            <span className="text-gray-500">Unser Gegenvorschlag: </span>
            <span className="font-medium text-blue-700">{fmtDt(appt.adminProposedAt)}</span>
            {appt.adminMessage && <p className="text-xs text-blue-700 italic mt-1">„{appt.adminMessage}"</p>}
          </div>
        )}

        {appt.status === "accepted" && appt.finalAt && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-sm text-emerald-900">
              <strong>Bestätigter Termin:</strong> {fmtDt(appt.finalAt)}
            </p>
          </div>
        )}

        {canAct && (
          <div className="border-t border-gray-100 pt-3 space-y-3">
            {!showPropose ? (
              <div className="flex flex-wrap gap-2">
                {appt.status === "pending" && (
                  <Button size="sm" onClick={() => action.mutate({ kind: "accept" })} className="bg-emerald-600 hover:bg-emerald-700">
                    <Check className="w-3.5 h-3.5 mr-1" /> Wunschtermin annehmen
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => setShowPropose(true)}>
                  <CalendarDays className="w-3.5 h-3.5 mr-1" /> Gegenvorschlag senden
                </Button>
                <Button size="sm" variant="ghost" onClick={() => action.mutate({ kind: "decline" })} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                  <X className="w-3.5 h-3.5 mr-1" /> Ablehnen
                </Button>
              </div>
            ) : (
              <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50/50 p-3">
                <p className="text-sm font-medium text-blue-900">Neuen Termin vorschlagen</p>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="date" min={todayStr} value={date} onChange={(e) => setDate(e.target.value)} />
                  <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                </div>
                <Textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Nette Begleitnachricht…" rows={2} />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => action.mutate({ kind: "propose" })} disabled={!date || !time} className="bg-amber-500 hover:bg-amber-600">
                    Vorschlag senden
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setShowPropose(false); setDate(""); setTime(""); setMsg(""); }}>
                    Abbrechen
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main admin page ─────────────────────────────────────────────────────────
export default function AdminKontakt() {
  const [tab, setTab] = useState<"chat" | "termine">("chat");

  const { data: chatUnread } = useQuery<{ count: number }>({
    queryKey: ["admin-chat-unread"],
    queryFn: async () => {
      const r = await fetch("/api/admin/chat/unread-count", { credentials: "include" });
      if (!r.ok) return { count: 0 };
      return r.json();
    },
    refetchInterval: 15000,
  });
  const { data: pending } = useQuery<{ count: number }>({
    queryKey: ["admin-appts-pending"],
    queryFn: async () => {
      const r = await fetch("/api/admin/appointments/pending-count", { credentials: "include" });
      if (!r.ok) return { count: 0 };
      return r.json();
    },
    refetchInterval: 15000,
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kontakt</h1>
        <p className="text-sm text-muted-foreground mt-1">Kunden-Chats und Terminanfragen</p>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setTab("chat")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors inline-flex items-center gap-1.5",
            tab === "chat" ? "border-amber-500 text-amber-700" : "border-transparent text-gray-500 hover:text-gray-800",
          )}
        >
          <MessageCircle className="w-4 h-4" /> Chats
          {chatUnread && chatUnread.count > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">{chatUnread.count}</span>
          )}
        </button>
        <button
          onClick={() => setTab("termine")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors inline-flex items-center gap-1.5",
            tab === "termine" ? "border-amber-500 text-amber-700" : "border-transparent text-gray-500 hover:text-gray-800",
          )}
        >
          <CalendarDays className="w-4 h-4" /> Termine
          {pending && pending.count > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">{pending.count}</span>
          )}
        </button>
      </div>

      {tab === "chat" ? <ChatSection /> : <AppointmentsSection />}
    </div>
  );
}
