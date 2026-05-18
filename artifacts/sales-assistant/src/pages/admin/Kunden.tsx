import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Trash2, Mail } from "lucide-react";

interface Customer {
  id: number;
  name: string;
  email: string;
  angebotsnummer: string;
  createdAt: string;
}

export default function Kunden() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [angebotsnummer, setAngebotsnummer] = useState("");
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
        body: JSON.stringify({ name, email, angebotsnummer }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? "Fehler beim Erstellen.");
      }
      return res.json() as Promise<Customer>;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
      setName(""); setEmail(""); setAngebotsnummer("");
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

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !angebotsnummer.trim()) return;
    createMutation.mutate();
  };

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
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Neues Kundenkonto anlegen</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[160px] space-y-1">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Julia & Markus Müller" value={name}
                  onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="flex-1 min-w-[200px] space-y-1">
                <Label htmlFor="email">E-Mail</Label>
                <Input id="email" type="email" placeholder="email@example.com" value={email}
                  onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="flex-1 min-w-[160px] space-y-1">
                <Label htmlFor="angebotsnummer">Angebotsnummer</Label>
                <Input id="angebotsnummer" placeholder="AN-2025-001" value={angebotsnummer}
                  onChange={(e) => setAngebotsnummer(e.target.value)} required />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Wird erstellt…" : "Erstellen"}
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
            <span className="font-semibold">Anmeldung im Kundenportal:</span> Kunden melden sich mit ihrer <span className="font-semibold">E-Mail-Adresse</span> und der <span className="font-semibold">Angebotsnummer</span> an.
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
            <div className="p-8 text-center text-muted-foreground text-sm">Noch keine Kundenkonten angelegt.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">E-Mail</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Angebotsnummer</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Erstellt</th>
                    <th className="w-12 px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c, i) => (
                    <tr key={c.id} className={`border-b border-border last:border-0 ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                      <td className="px-4 py-3 font-medium">{c.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Mail className="w-3 h-3" />
                          {c.email}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{c.angebotsnummer}</code>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {new Date(c.createdAt).toLocaleDateString("de-DE", {
                          day: "2-digit", month: "2-digit", year: "numeric",
                        })}
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
