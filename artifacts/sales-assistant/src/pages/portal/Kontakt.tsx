import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, CalendarDays, Send, Check, X, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ChatMsg {
  id: number;
  sender: "customer" | "admin";
  body: string;
  adminId: number | null;
  adminName: string | null;
  adminHasAvatar: boolean;
  createdAt: string;
}

interface Appt {
  id: number;
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

// ── Chat panel ───────────────────────────────────────────────────────────────
function ChatPanel() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages = [] } = useQuery<ChatMsg[]>({
    queryKey: ["customer-chat"],
    queryFn: async () => {
      const r = await fetch("/api/customer/chat", { credentials: "include" });
      if (!r.ok) throw new Error("Fehler");
      return r.json() as Promise<ChatMsg[]>;
    },
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length]);

  const send = useMutation({
    mutationFn: async (body: string) => {
      const r = await fetch("/api/customer/chat", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? "Fehler");
    },
    onSuccess: () => {
      setText("");
      void qc.invalidateQueries({ queryKey: ["customer-chat"] });
    },
    onError: (e: Error) => toast({ title: "Konnte nicht senden", description: e.message, variant: "destructive" }),
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    send.mutate(text.trim());
  }

  return (
    <Card className="border-gray-200 overflow-hidden">
      <div ref={scrollRef} className="h-[420px] overflow-y-auto p-4 bg-gray-50/50 space-y-3">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground mt-12">
            Noch keine Nachrichten. Schreibt uns einfach!
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender === "customer";
            const adminLabel = m.adminName ?? "NIWE Team";
            const initials = adminLabel.split(/\s+/).map((p) => p.charAt(0)).join("").slice(0, 2).toUpperCase();
            return (
              <div key={m.id} className={cn("flex items-end gap-2", mine ? "justify-end" : "justify-start")}>
                {!mine && (
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-amber-100 text-amber-700 flex items-center justify-center text-[10px] font-semibold shrink-0">
                    {m.adminId && m.adminHasAvatar ? (
                      <img src={`/api/admin-avatars/${m.adminId}.jpg`} alt={adminLabel} className="w-full h-full object-cover" />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>
                )}
                <div className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2 shadow-sm",
                  mine ? "bg-amber-500 text-white rounded-br-sm" : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm",
                )}>
                  {!mine && (
                    <p className="text-[11px] font-semibold text-amber-700 mb-0.5">{adminLabel}</p>
                  )}
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.body}</p>
                  <p className={cn("text-[10px] mt-1", mine ? "text-amber-100" : "text-gray-400")}>
                    {fmtTime(m.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
      <form onSubmit={onSubmit} className="border-t border-gray-200 p-3 bg-white flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Nachricht schreiben…"
          maxLength={4000}
          disabled={send.isPending}
        />
        <Button type="submit" disabled={!text.trim() || send.isPending} className="bg-amber-500 hover:bg-amber-600">
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </Card>
  );
}

// ── Appointment status badge ────────────────────────────────────────────────
function StatusBadge({ status }: { status: Appt["status"] }) {
  const map: Record<Appt["status"], { label: string; cls: string; icon: React.ReactNode }> = {
    pending:               { label: "Wartet auf Rückmeldung", cls: "bg-amber-100 text-amber-800 border-amber-200",       icon: <Clock className="w-3 h-3" /> },
    proposed_by_admin:     { label: "Gegenvorschlag erhalten", cls: "bg-blue-100 text-blue-800 border-blue-200",         icon: <AlertCircle className="w-3 h-3" /> },
    accepted:              { label: "Bestätigt",               cls: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: <CheckCircle2 className="w-3 h-3" /> },
    declined_by_admin:     { label: "Abgelehnt",               cls: "bg-gray-100 text-gray-600 border-gray-200",         icon: <X className="w-3 h-3" /> },
    declined_by_customer:  { label: "Abgelehnt (von euch)",    cls: "bg-gray-100 text-gray-600 border-gray-200",         icon: <X className="w-3 h-3" /> },
    cancelled:             { label: "Storniert",               cls: "bg-gray-100 text-gray-600 border-gray-200",         icon: <X className="w-3 h-3" /> },
  };
  const s = map[status];
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border", s.cls)}>
      {s.icon}{s.label}
    </span>
  );
}

// ── Appointment panel ───────────────────────────────────────────────────────
function AppointmentPanel() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [message, setMessage] = useState("");

  const { data: appts = [] } = useQuery<Appt[]>({
    queryKey: ["customer-appointments"],
    queryFn: async () => {
      const r = await fetch("/api/customer/appointments", { credentials: "include" });
      if (!r.ok) throw new Error("Fehler");
      return r.json() as Promise<Appt[]>;
    },
    refetchInterval: 15000,
  });

  const request = useMutation({
    mutationFn: async () => {
      if (!date || !time) throw new Error("Bitte Datum und Uhrzeit angeben.");
      const proposedAt = new Date(`${date}T${time}:00`).toISOString();
      const r = await fetch("/api/customer/appointments", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposedAt, message: message.trim() || undefined }),
      });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? "Fehler");
    },
    onSuccess: () => {
      setDate(""); setTime(""); setMessage("");
      toast({ title: "Terminanfrage gesendet", description: "Wir melden uns so schnell wie möglich bei euch." });
      void qc.invalidateQueries({ queryKey: ["customer-appointments"] });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const respond = useMutation({
    mutationFn: async ({ id, action, msg }: { id: number; action: "accept" | "decline"; msg?: string }) => {
      const r = await fetch(`/api/customer/appointments/${id}/${action}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? "Fehler");
    },
    onSuccess: (_d, vars) => {
      toast({
        title: vars.action === "accept" ? "Termin angenommen" : "Termin abgelehnt",
        description: vars.action === "accept" ? "Die Bestätigung findet ihr im Posteingang." : "Wir finden gemeinsam einen neuen Termin.",
      });
      void qc.invalidateQueries({ queryKey: ["customer-appointments"] });
      void qc.invalidateQueries({ queryKey: ["customer-unread-count"] });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  // min date = today
  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      {/* New request form */}
      <Card className="border-gray-200">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-gray-900">Neue Terminanfrage</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Schlagt einen Wunschtermin für ein Beratungsgespräch vor — wir bestätigen oder schlagen eine Alternative vor.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Datum</label>
              <Input type="date" min={todayStr} value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Uhrzeit</label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Nachricht (optional)</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Worum geht es? Was ist euch wichtig?"
              rows={3}
              maxLength={1000}
            />
          </div>
          <Button
            onClick={() => request.mutate()}
            disabled={!date || !time || request.isPending}
            className="bg-amber-500 hover:bg-amber-600"
          >
            Anfrage senden
          </Button>
        </CardContent>
      </Card>

      {/* Existing appointments */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-800">Eure Terminanfragen</h3>
        {appts.length === 0 ? (
          <Card className="border-dashed border-gray-200">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Noch keine Anfragen.
            </CardContent>
          </Card>
        ) : (
          appts.map((a) => <AppointmentCard key={a.id} appt={a} onRespond={(action, msg) => respond.mutate({ id: a.id, action, msg })} />)
        )}
      </div>
    </div>
  );
}

function AppointmentCard({ appt, onRespond }: { appt: Appt; onRespond: (action: "accept" | "decline", msg?: string) => void }) {
  const [declineMsg, setDeclineMsg] = useState("");
  const [showDecline, setShowDecline] = useState(false);

  return (
    <Card className="border-gray-200">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-xs text-gray-500">
            Angefragt am {new Date(appt.createdAt).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}
          </p>
          <StatusBadge status={appt.status} />
        </div>

        {appt.customerProposedAt && (
          <div className="text-sm">
            <span className="text-gray-500">Euer Vorschlag: </span>
            <span className="font-medium text-gray-900">{fmtDt(appt.customerProposedAt)}</span>
          </div>
        )}
        {appt.customerMessage && (
          <p className="text-xs text-gray-600 italic bg-gray-50 rounded-md px-3 py-2">„{appt.customerMessage}"</p>
        )}

        {appt.status === "proposed_by_admin" && appt.adminProposedAt && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-2">
            <p className="text-sm font-medium text-blue-900">Unser Gegenvorschlag:</p>
            <p className="text-sm text-blue-800 font-semibold">{fmtDt(appt.adminProposedAt)}</p>
            {appt.adminMessage && <p className="text-xs text-blue-700 italic">„{appt.adminMessage}"</p>}
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={() => onRespond("accept")} className="bg-emerald-600 hover:bg-emerald-700">
                <Check className="w-3.5 h-3.5 mr-1" /> Annehmen
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowDecline((v) => !v)}>
                <X className="w-3.5 h-3.5 mr-1" /> Ablehnen
              </Button>
            </div>
            {showDecline && (
              <div className="space-y-2 pt-2">
                <Textarea
                  value={declineMsg}
                  onChange={(e) => setDeclineMsg(e.target.value)}
                  placeholder="Optionaler Hinweis (z. B. Wunschtermin)…"
                  rows={2}
                />
                <Button size="sm" variant="destructive" onClick={() => onRespond("decline", declineMsg.trim() || undefined)}>
                  Ablehnen bestätigen
                </Button>
              </div>
            )}
          </div>
        )}

        {appt.status === "accepted" && appt.finalAt && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 space-y-2">
            <p className="text-sm font-medium text-emerald-900">Bestätigter Termin:</p>
            <p className="text-sm text-emerald-800 font-semibold">{fmtDt(appt.finalAt)}</p>
            <a
              href={`/api/customer/appointments/${appt.id}/ical`}
              className="inline-flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-900 underline"
            >
              <CalendarDays className="w-3.5 h-3.5" /> In Kalender speichern (.ics)
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function Kontakt() {
  const [tab, setTab] = useState<"chat" | "termin">("chat");

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-amber-500" />
          Kontakt
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Schreibt uns direkt oder fragt einen Beratungstermin an.
        </p>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setTab("chat")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            tab === "chat" ? "border-amber-500 text-amber-700" : "border-transparent text-gray-500 hover:text-gray-800",
          )}
        >
          <MessageCircle className="w-4 h-4 inline mr-1.5" /> Chat
        </button>
        <button
          onClick={() => setTab("termin")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            tab === "termin" ? "border-amber-500 text-amber-700" : "border-transparent text-gray-500 hover:text-gray-800",
          )}
        >
          <CalendarDays className="w-4 h-4 inline mr-1.5" /> Termin anfragen
        </button>
      </div>

      {tab === "chat" ? <ChatPanel /> : <AppointmentPanel />}
    </div>
  );
}
