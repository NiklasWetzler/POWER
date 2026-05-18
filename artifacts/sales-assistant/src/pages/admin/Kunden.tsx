import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Users, Plus, Trash2, Mail, Send, X, Paperclip, FileText,
  Pencil, ClipboardList, Music2, FileSignature,
} from "lucide-react";

interface Customer {
  id: number;
  name: string;
  email: string;
  angebotsnummer: string;
  hochzeitsdatum: string | null;
  telefon: string | null;
  strasse: string | null;
  plz: string | null;
  ort: string | null;
  location: string | null;
  djKuenstler: string | null;
  djSpielzeit: string | null;
  djBemerkung: string | null;
  djGage: string | null;
  djVerlaengerung: string | null;
  djAnzahlungProzent: string | null;
  djAnzahlungFrist: string | null;
  djSondervereinbarungen: string | null;
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

const AVAILABLE_FORMS: { id: string; title: string; description: string; icon: typeof Music2 }[] = [
  { id: "musikfragebogen", title: "Musikfragebogen", description: "Musikwünsche, Genres, Ablauf", icon: Music2 },
  { id: "dj-vertrag", title: "DJ-Booking Vertrag", description: "Vertrag mit Unterschrift", icon: FileSignature },
];

// ─── Send-message modal ──────────────────────────────────────────────────────
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

// ─── Edit customer modal ────────────────────────────────────────────────────
function EditCustomerModal({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [f, setF] = useState({
    name: customer.name,
    email: customer.email,
    angebotsnummer: customer.angebotsnummer,
    hochzeitsdatum: customer.hochzeitsdatum ?? "",
    telefon: customer.telefon ?? "",
    strasse: customer.strasse ?? "",
    plz: customer.plz ?? "",
    ort: customer.ort ?? "",
    location: customer.location ?? "",
    djKuenstler: customer.djKuenstler ?? "Nik Wetzler",
    djSpielzeit: customer.djSpielzeit ?? "21:00 Uhr bis 02:00 Uhr",
    djBemerkung: customer.djBemerkung ?? "inklusive Hintergrundmusik zu Beginn nach vorheriger Absprache",
    djGage: customer.djGage ?? "1.300,00 €",
    djVerlaengerung: customer.djVerlaengerung ?? "100,00 €",
    djAnzahlungProzent: customer.djAnzahlungProzent ?? "30 %",
    djAnzahlungFrist: customer.djAnzahlungFrist ?? "14 Tagen",
    djSondervereinbarungen: customer.djSondervereinbarungen ?? "",
  });

  const save = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(f),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(j.error ?? "Fehler beim Speichern.");
      }
    },
    onSuccess: () => {
      toast({ title: "Gespeichert", description: `${f.name} wurde aktualisiert.` });
      void queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
      onClose();
    },
    onError: (err) => toast({ title: "Fehler", description: err instanceof Error ? err.message : "", variant: "destructive" }),
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Kunde bearbeiten</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); save.mutate(); }}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1 sm:col-span-2">
              <Label>Name des Brautpaares *</Label>
              <Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>E-Mail *</Label>
              <Input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Angebotsnummer *</Label>
              <Input required value={f.angebotsnummer} onChange={(e) => setF({ ...f, angebotsnummer: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Telefon</Label>
              <Input value={f.telefon} onChange={(e) => setF({ ...f, telefon: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Hochzeitsdatum</Label>
              <Input type="date" value={f.hochzeitsdatum} onChange={(e) => setF({ ...f, hochzeitsdatum: e.target.value })} />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>Straße & Hausnummer</Label>
              <Input value={f.strasse} onChange={(e) => setF({ ...f, strasse: e.target.value })} placeholder="z. B. Musterstraße 12" />
            </div>
            <div className="space-y-1">
              <Label>PLZ</Label>
              <Input value={f.plz} onChange={(e) => setF({ ...f, plz: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Ort</Label>
              <Input value={f.ort} onChange={(e) => setF({ ...f, ort: e.target.value })} />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>Hochzeitslocation</Label>
              <Input value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} placeholder="z. B. Restaurant Ulm" />
            </div>
          </div>

          {/* DJ-Vertrag Konditionen */}
          <div className="pt-2 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <FileSignature className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-gray-800">DJ-Vertrag Konditionen</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Diese Werte erscheinen im Vertrag, den der Kunde im Portal sieht. Er kann sie nicht verändern.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>DJ / Künstler</Label>
                <Input value={f.djKuenstler} onChange={(e) => setF({ ...f, djKuenstler: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Vereinbarte Spielzeit</Label>
                <Input value={f.djSpielzeit} onChange={(e) => setF({ ...f, djSpielzeit: e.target.value })} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>Bemerkung</Label>
                <Input value={f.djBemerkung} onChange={(e) => setF({ ...f, djBemerkung: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Gesamtgage (netto)</Label>
                <Input value={f.djGage} onChange={(e) => setF({ ...f, djGage: e.target.value })} placeholder="z. B. 1.300,00 €" />
              </div>
              <div className="space-y-1">
                <Label>Verlängerung pro Stunde</Label>
                <Input value={f.djVerlaengerung} onChange={(e) => setF({ ...f, djVerlaengerung: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Anzahlung</Label>
                <Input value={f.djAnzahlungProzent} onChange={(e) => setF({ ...f, djAnzahlungProzent: e.target.value })} placeholder="z. B. 30 %" />
              </div>
              <div className="space-y-1">
                <Label>Frist für Anzahlung</Label>
                <Input value={f.djAnzahlungFrist} onChange={(e) => setF({ ...f, djAnzahlungFrist: e.target.value })} placeholder="z. B. 14 Tagen" />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>Sondervereinbarungen (§13, optional)</Label>
                <Textarea
                  rows={3}
                  value={f.djSondervereinbarungen}
                  onChange={(e) => setF({ ...f, djSondervereinbarungen: e.target.value })}
                  placeholder="Bleibt leer, falls keine."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Abbrechen</Button>
            <Button type="submit" disabled={save.isPending}>{save.isPending ? "Speichern…" : "Speichern"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Assign forms modal ─────────────────────────────────────────────────────
function AssignFormsModal({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: assigned, isLoading } = useQuery<string[]>({
    queryKey: ["admin-customer-forms", customer.id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/customers/${customer.id}/forms`, { credentials: "include" });
      if (!res.ok) throw new Error("Fehler");
      return res.json() as Promise<string[]>;
    },
  });

  useEffect(() => {
    if (assigned) setSelected(new Set(assigned));
  }, [assigned]);

  const save = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/customers/${customer.id}/forms`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ formIds: Array.from(selected) }),
      });
      if (!res.ok) throw new Error("Fehler beim Speichern.");
    },
    onSuccess: () => {
      toast({ title: "Formulare aktualisiert", description: `Für ${customer.name} gespeichert.` });
      void queryClient.invalidateQueries({ queryKey: ["admin-customer-forms", customer.id] });
      onClose();
    },
    onError: (err) => toast({ title: "Fehler", description: err instanceof Error ? err.message : "", variant: "destructive" }),
  });

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold">Formulare zuweisen</h2>
            <p className="text-xs text-gray-500">{customer.name}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Wird geladen…</p>
          ) : (
            AVAILABLE_FORMS.map((form) => {
              const Icon = form.icon;
              const isSel = selected.has(form.id);
              return (
                <label
                  key={form.id}
                  className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                    isSel ? "bg-amber-50 border-amber-300" : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <Checkbox checked={isSel} onCheckedChange={() => toggle(form.id)} className="mt-0.5" />
                  <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900">{form.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{form.description}</p>
                  </div>
                </label>
              );
            })
          )}
          <p className="text-xs text-muted-foreground pt-2">
            Nur ausgewählte Formulare erscheinen im Portal des Kunden unter „Formulare".
          </p>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
          <Button variant="ghost" onClick={onClose}>Abbrechen</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Speichern…" : "Speichern"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────
export default function Kunden() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [createForm, setCreateForm] = useState({
    name: "", email: "", angebotsnummer: "", hochzeitsdatum: "",
    telefon: "", strasse: "", plz: "", ort: "", location: "",
    djKuenstler: "Nik Wetzler", djGage: "",
  });
  const [showForm, setShowForm] = useState(false);
  const [messageCustomer, setMessageCustomer] = useState<Customer | null>(null);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [assignCustomer, setAssignCustomer] = useState<Customer | null>(null);

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
        body: JSON.stringify(createForm),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? "Fehler beim Erstellen.");
      }
      return res.json() as Promise<Customer>;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
      setCreateForm({
        name: "", email: "", angebotsnummer: "", hochzeitsdatum: "",
        telefon: "", strasse: "", plz: "", ort: "", location: "",
        djKuenstler: "Nik Wetzler", djGage: "",
      });
      setShowForm(false);
      toast({ title: "Kundenkonto erstellt" });
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

  function setCF<K extends keyof typeof createForm>(k: K, v: string) {
    setCreateForm((p) => ({ ...p, [k]: v }));
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Kundenverwaltung</h1>
            <p className="text-sm text-muted-foreground">Zugangsdaten, Adresse, Formulare und Nachrichten verwalten</p>
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
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              <div className="space-y-1 sm:col-span-2">
                <Label>Name des Brautpaares *</Label>
                <Input placeholder="z. B. Julia & Markus Müller" value={createForm.name} onChange={(e) => setCF("name", e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>E-Mail *</Label>
                <Input type="email" value={createForm.email} onChange={(e) => setCF("email", e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>Angebotsnummer *</Label>
                <Input value={createForm.angebotsnummer} onChange={(e) => setCF("angebotsnummer", e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>Telefon</Label>
                <Input value={createForm.telefon} onChange={(e) => setCF("telefon", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Hochzeitsdatum</Label>
                <Input type="date" value={createForm.hochzeitsdatum} onChange={(e) => setCF("hochzeitsdatum", e.target.value)} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>Straße & Hausnummer</Label>
                <Input value={createForm.strasse} onChange={(e) => setCF("strasse", e.target.value)} placeholder="z. B. Musterstraße 12" />
              </div>
              <div className="space-y-1">
                <Label>PLZ</Label>
                <Input value={createForm.plz} onChange={(e) => setCF("plz", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Ort</Label>
                <Input value={createForm.ort} onChange={(e) => setCF("ort", e.target.value)} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>Hochzeitslocation</Label>
                <Input value={createForm.location} onChange={(e) => setCF("location", e.target.value)} placeholder="z. B. Restaurant Ulm" />
              </div>
              <div className="sm:col-span-2 border-t border-gray-200 pt-3 mt-1">
                <p className="text-xs font-semibold text-gray-700 mb-2">DJ-Vertrag (optional — kann später angepasst werden)</p>
              </div>
              <div className="space-y-1">
                <Label>DJ / Künstler</Label>
                <Input value={createForm.djKuenstler} onChange={(e) => setCF("djKuenstler", e.target.value)} placeholder="z. B. Nik Wetzler" />
              </div>
              <div className="space-y-1">
                <Label>Gesamtgage (netto)</Label>
                <Input value={createForm.djGage} onChange={(e) => setCF("djGage", e.target.value)} placeholder="z. B. 1.300,00 €" />
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
            <span className="font-semibold">Tipp:</span> Über „Formulare" könnt ihr pro Kunde festlegen,
            welche Formulare im Kundenportal sichtbar sind. Adressdaten werden automatisch in den DJ-Vertrag übernommen.
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
              Noch keine Kundenkonten angelegt.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Brautpaar</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Hochzeit</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Kontakt</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Angebot</th>
                    <th className="w-72 px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c, i) => {
                    const days = daysUntil(c.hochzeitsdatum);
                    return (
                      <tr key={c.id} className={`border-b border-border last:border-0 ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                        <td className="px-4 py-3">
                          <div className="font-medium">{c.name}</div>
                          {(c.strasse || c.ort) && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {[c.strasse, [c.plz, c.ort].filter(Boolean).join(" ")].filter(Boolean).join(", ")}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {c.hochzeitsdatum ? (
                            <div>
                              <span>{new Date(c.hochzeitsdatum + "T12:00:00").toLocaleDateString("de-DE")}</span>
                              {days && (
                                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${days === "vergangen" ? "bg-gray-100 text-gray-500" : "bg-amber-100 text-amber-700"}`}>
                                  {days}
                                </span>
                              )}
                              {c.location && <div className="text-xs mt-0.5">{c.location}</div>}
                            </div>
                          ) : (
                            <span className="text-muted-foreground/50">–</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          <div className="inline-flex items-center gap-1.5"><Mail className="w-3 h-3" />{c.email}</div>
                          {c.telefon && <div className="mt-0.5">{c.telefon}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{c.angebotsnummer}</code>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 justify-end flex-wrap">
                            <Button variant="outline" size="sm" className="gap-1 h-7 text-xs" onClick={() => setAssignCustomer(c)}>
                              <ClipboardList className="w-3 h-3" /> Formulare
                            </Button>
                            <Button variant="outline" size="sm" className="gap-1 h-7 text-xs" onClick={() => setMessageCustomer(c)}>
                              <Send className="w-3 h-3" /> Nachricht
                            </Button>
                            <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setEditCustomer(c)}>
                              <Pencil className="w-3.5 h-3.5" />
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

      {messageCustomer && <SendMessageModal customer={messageCustomer} onClose={() => setMessageCustomer(null)} />}
      {editCustomer && <EditCustomerModal customer={editCustomer} onClose={() => setEditCustomer(null)} />}
      {assignCustomer && <AssignFormsModal customer={assignCustomer} onClose={() => setAssignCustomer(null)} />}
    </div>
  );
}
