import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Trash2, Mail, Calendar } from "lucide-react";

interface Customer {
  id: number;
  name: string;
  email: string;
  angebotsnummer: string;
  hochzeitsdatum: string | null;
  createdAt: string;
}

export default function Kunden() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [angebotsnummer, setAngebotsnummer] = useState("");
  const [hochzeitsdatum, setHochzeitsdatum] = useState("");
  const [showForm, setShowForm] = useState(false);

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
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Kundenverwaltung</h1>
            <p className="text-sm text-muted-foreground">Zugangsdaten für das Kundenportal verwalten</p>
          </div>
        </div>
        <Button onClick={() => setShowForm((v) => !v)} className="gap-2">
          <Plus className="w-4 h-4" />
          Neuer Kunde
        </Button>
      </div>

      {/* Create form */}
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
                <Input
                  id="name"
                  placeholder="z. B. Julia & Markus Müller"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="datum">Datum der Hochzeit</Label>
                <Input
                  id="datum"
                  type="date"
                  value={hochzeitsdatum}
                  onChange={(e) => setHochzeitsdatum(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">E-Mail-Adresse *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="brautpaar@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="angebotsnummer">Angebotsnummer *</Label>
                <Input
                  id="angebotsnummer"
                  placeholder="AN-2025-001"
                  value={angebotsnummer}
                  onChange={(e) => setAngebotsnummer(e.target.value)}
                  required
                />
              </div>
              <div className="sm:col-span-2 flex gap-2 pt-1">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Wird erstellt…" : "Zugang erstellen"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  Abbrechen
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-3 px-4">
          <p className="text-xs text-blue-700">
            <span className="font-semibold">Kunden-Login:</span> E-Mail-Adresse + Angebotsnummer.
            Der Kunde sieht im Portal den Countdown zur Hochzeit, seine Formulare und den Status.
          </p>
        </CardContent>
      </Card>

      {/* Table */}
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
                    <th className="w-12 px-4 py-3" />
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
    </div>
  );
}
