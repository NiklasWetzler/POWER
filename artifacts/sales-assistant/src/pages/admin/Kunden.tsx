import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Trash2, Mail, Send, X, Paperclip, FileText } from "lucide-react";

interface Customer {
  id: number;
  name: string;
  email: string;
  angebotsnummer: string;
  hochzeitsdatum: string | null;
  createdAt: string;
}

interface Message {
  id: number;
  subject: string;
  body: string;
  pdfFilename: string | null;
  readAt: string | null;
  createdAt: string;
}

// ─── Send-message modal ───────────────────────────────────────────────────────
function SendMessageModal({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);

  const { data: history = [] } = useQuery<Message[]>({
    queryKey: ["admin-customer-messages", customer.id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/customers/${customer.id}/messages`, { credentials: "include" });
      if (!res.ok) throw new Error("Fehler");
      return res.json() as Promise<Message[]>;
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/customers/${customer.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          subject,
          body,
          pdfBase64: pdfBase64 ?? undefined,
          pdfFilename: pdfFile?.name,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(j.error ?? "Fehler beim Senden.");
      }
    },
    onSuccess: () => {
      toast({ title: "Nachricht gesendet", description: `An ${customer.name}.` });
      setSubject(""); setBody(""); setPdfFile(null); setPdfBase64(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-customer-messages", customer.id] });
    },
    onError: (err) => {
      toast({ title: "Fehler", description: err instanceof Error ? err.message : "Unbekannt.", variant: "destructive" });
    },
  });

  const deleteMessage = useMutation({
    mutationFn: async (mid: number) => {
      await fetch(`/api/admin/customers/${customer.id}/messages/${mid}`, { method: "DELETE", credentials: "include" });
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin-customer-messages", customer.id] }),
  });

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) { setPdfFile(null); setPdfBase64(null); return; }
    if (f.type !== "application/pdf") {
      toast({ title: "Nur PDF-Dateien", description: "Bitte eine PDF auswählen.", variant: "destructive" });
      e.target.value = "";
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast({ title: "Datei zu groß", description: "Maximal 10 MB.", variant: "destructive" });
      e.target.value = "";
      return;
    }
    setPdfFile(f);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] ?? "";
      setPdfBase64(base64);
    };
    reader.readAsDataURL(f);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Nachricht an {customer.name}</h2>
            <p className="text-xs text-gray-500">{customer.email}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Compose */}
          <form
            onSubmit={(e) => { e.preventDefault(); sendMutation.mutate(); }}
            className="space-y-3"
          >
            <div className="space-y-1">
              <Label htmlFor="subject">Betreff *</Label>
              <Input id="subject" required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="z. B. Eure Bestätigung" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="body">Nachricht *</Label>
              <Textarea id="body" required value={body} onChange={(e) => setBody(e.target.value)} rows={6} placeholder="Schreibt eure Nachricht…" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pdf" className="flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5" />
                PDF-Anhang (optional, max. 10 MB)
              </Label>
              <Input id="pdf" type="file" accept="application/pdf" onChange={handleFile} />
              {pdfFile && (
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <FileText className="w-3 h-3" /> {pdfFile.name} ({Math.round(pdfFile.size / 1024)} KB)
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" onClick={onClose}>Schließen</Button>
              <Button type="submit" disabled={sendMutation.isPending || !subject || !body} className="gap-1.5">
                <Send className="w-3.5 h-3.5" />
                {sendMutation.isPending ? "Wird gesendet…" : "Senden"}
              </Button>
            </div>
          </form>

          {/* History */}
          {history.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Bisherige Nachrichten ({history.length})
              </h3>
              <div className="space-y-2">
                {history.map((m) => (
                  <div key={m.id} className="rounded-lg border border-gray-200 px-3 py-2 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 truncate">{m.subject}</p>
                        <p className="text-gray-500 mt-0.5 line-clamp-2 whitespace-pre-wrap">{m.body}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-gray-400">
                            {new Date(m.createdAt).toLocaleDateString("de-DE")} {new Date(m.createdAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {m.pdfFilename && (
                            <span className="text-gray-400 flex items-center gap-0.5"><Paperclip className="w-3 h-3" />{m.pdfFilename}</span>
                          )}
                          {m.readAt ? (
                            <span className="text-emerald-600">✓ gelesen</span>
                          ) : (
                            <span className="text-amber-600">ungelesen</span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost" size="icon"
                        className="w-6 h-6 text-gray-400 hover:text-destructive"
                        onClick={() => { if (confirm("Nachricht löschen?")) deleteMessage.mutate(m.id); }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Kunden() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [angebotsnummer, setAngebotsnummer] = useState("");
  const [hochzeitsdatum, setHochzeitsdatum] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [messageCustomer, setMessageCustomer] = useState<Customer | null>(null);

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ["admin-customers"],
    queryFn: async () => {
      const res = await fetch("/api/admin/customers", { credentials: "include" });
      if (!res.ok) throw new Error("Fehler beim Laden.");
      return res.json() as Promise<Customer[]>;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, angebotsnummer, hochzeitsdatum: hochzeitsdatum || undefined }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? "Fehler beim Erstellen.");
      }
      return res.json() as Promise<Customer>;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
      setName(""); setEmail(""); setAngebotsnummer(""); setHochzeitsdatum("");
      setShowForm(false);
      toast({ title: "Kundenkonto erstellt", description: `Zugang für ${name} wurde angelegt.` });
    },
    onError: (err) => {
      toast({ title: "Fehler", description: err instanceof Error ? err.message : "Unbekannt.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/admin/customers/${id}`, { method: "DELETE", credentials: "include" });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
      toast({ title: "Kundenkonto gelöscht." });
    },
  });

  function daysUntil(datum: string | null): string | null {
    if (!datum) return null;
    const diff = Math.ceil((new Date(datum).getTime() - Date.now()) / 86400000);
    if (diff < 0) return "vergangen";
    if (diff === 0) return "heute!";
    return `in ${diff} Tagen`;
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Kundenverwaltung</h1>
            <p className="text-sm text-muted-foreground">Zugangsdaten verwalten und Nachrichten an Kunden senden</p>
          </div>
        </div>
        <Button onClick={() => setShowForm((v) => !v)} className="gap-2">
          <Plus className="w-4 h-4" />
          Neuer Kunde
        </Button>
      </div>

      {showForm && (
        <Card className="border-amber-200 bg-amber-50/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Neues Kundenkonto anlegen</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <div className="space-y-1">
                <Label htmlFor="name">Name des Brautpaares *</Label>
                <Input id="name" placeholder="z. B. Julia & Markus Müller" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="datum">Datum der Hochzeit</Label>
                <Input id="datum" type="date" value={hochzeitsdatum} onChange={(e) => setHochzeitsdatum(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">E-Mail-Adresse *</Label>
                <Input id="email" type="email" placeholder="brautpaar@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="angebotsnummer">Angebotsnummer *</Label>
                <Input id="angebotsnummer" placeholder="AN-2025-001" value={angebotsnummer} onChange={(e) => setAngebotsnummer(e.target.value)} required />
              </div>
              <div className="sm:col-span-2 flex gap-2 pt-1">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Wird erstellt…" : "Zugang erstellen"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Abbrechen</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-3 px-4">
          <p className="text-xs text-blue-700">
            <span className="font-semibold">Kunden-Login:</span> E-Mail-Adresse + Angebotsnummer.
            Über „Nachricht senden" könnt ihr den Brautpaaren Texte und PDFs in den Portal-Eingang schicken.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Alle Kundenkonten ({customers.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Wird geladen…</div>
          ) : customers.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Noch keine Kundenkonten angelegt. Klicke auf „Neuer Kunde".
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Brautpaar</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Hochzeit</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">E-Mail</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Angebotsnr.</th>
                    <th className="w-44 px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c, i) => {
                    const days = daysUntil(c.hochzeitsdatum);
                    return (
                      <tr key={c.id} className={`border-b border-border last:border-0 ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                        <td className="px-4 py-3 font-medium">{c.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {c.hochzeitsdatum ? (
                            <div>
                              <span>{new Date(c.hochzeitsdatum + "T12:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}</span>
                              {days && (
                                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${days === "vergangen" ? "bg-gray-100 text-gray-500" : "bg-amber-100 text-amber-700"}`}>
                                  {days}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground/50">–</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <Mail className="w-3 h-3" />
                            {c.email}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{c.angebotsnummer}</code>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 justify-end">
                            <Button
                              variant="outline" size="sm"
                              className="gap-1.5 h-7 text-xs"
                              onClick={() => setMessageCustomer(c)}
                            >
                              <Send className="w-3 h-3" />
                              Nachricht
                            </Button>
                            <Button
                              variant="ghost" size="icon"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 w-7 h-7"
                              onClick={() => {
                                if (confirm(`Kundenkonto von "${c.name}" wirklich löschen?`)) {
                                  deleteMutation.mutate(c.id);
                                }
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {messageCustomer && (
        <SendMessageModal customer={messageCustomer} onClose={() => setMessageCustomer(null)} />
      )}
    </div>
  );
}
