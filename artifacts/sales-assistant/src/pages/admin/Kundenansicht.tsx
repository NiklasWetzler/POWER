import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Eye, Search, Info } from "lucide-react";

interface PreviewCustomer {
  id: number;
  name: string;
  email: string;
  angebotsnummer: string;
  hochzeitsdatum: string | null;
  createdAt: string;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });
}

export default function Kundenansicht() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [, navigate] = useLocation();
  const { me, loading: authLoading } = useAuth();
  const [q, setQ] = useState("");

  // Guard: only super-admins may use this page. Regular admins get bounced
  // back to the dashboard before we even try to load the customer list.
  useEffect(() => {
    if (!authLoading && me && !me.isSuperAdmin) {
      navigate("/admin");
    }
  }, [authLoading, me, navigate]);

  if (authLoading || !me) return <div className="p-6 text-sm text-muted-foreground">Wird geladen…</div>;
  if (!me.isSuperAdmin) return null;

  const { data: customers = [], isLoading } = useQuery<PreviewCustomer[]>({
    queryKey: ["preview-customers", q],
    queryFn: async () => {
      const url = q
        ? `/api/admin/preview/customers?q=${encodeURIComponent(q)}`
        : "/api/admin/preview/customers";
      const r = await fetch(url, { credentials: "include" });
      if (!r.ok) throw new Error("Konnte Kundenliste nicht laden.");
      return r.json();
    },
  });

  const start = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`/api/admin/preview/start/${id}`, {
        method: "POST",
        credentials: "include",
      });
      const data = (await r.json().catch(() => ({}))) as { error?: string; customerName?: string };
      if (!r.ok) throw new Error(data.error ?? "Fehler.");
      return data;
    },
    onSuccess: () => {
      // Force every query to refetch with the new (customer) session.
      void qc.invalidateQueries();
      // Jump straight into the customer portal.
      navigate("/portal");
    },
    onError: (e: Error) => toast({ title: "Vorschau fehlgeschlagen", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kundenansicht (Vorschau)</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Wähle einen Kunden, um den Kundenbereich genau so zu sehen wie er. Du kannst alle Formulare,
          den Chat und Terminanfragen testen. Oben erscheint ein Banner mit dem du jederzeit zurück
          ins Admin-Backend kommst.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50/60 px-3 py-2 text-xs text-amber-900">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          <strong>Achtung:</strong> Aktionen in der Vorschau sind <em>echt</em> für den jeweiligen Kunden
          (z. B. gesendete Chat-Nachrichten, abgeschickte Formulare). Nutze sie zum Testen mit Bedacht
          oder lege dir einen eigenen Test-Kunden an.
        </span>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Suche nach Name, E-Mail oder Angebotsnummer…"
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Wird geladen…</div>
      ) : customers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Keine Kunden gefunden.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2">
          {customers.map((c) => (
            <Card key={c.id} className="border-gray-200">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-semibold shrink-0">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">{c.name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {c.email} · #{c.angebotsnummer}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Hochzeit: {fmtDate(c.hochzeitsdatum)} · angelegt {fmtDate(c.createdAt)}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600"
                  disabled={start.isPending}
                  onClick={() => start.mutate(c.id)}
                >
                  <Eye className="w-4 h-4 mr-1.5" /> Vorschau öffnen
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
