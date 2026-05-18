import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Mail, ClipboardList, CheckCircle2, Clock, Circle, Send, Link2 } from "lucide-react";

interface Submission {
  id: number;
  brautpaar: string;
  datum: string | null;
  location: string | null;
  status: "open" | "in_progress" | "done";
  emailSent: string;
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  open: "Offen",
  in_progress: "In Bearbeitung",
  done: "Erledigt",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  open: <Circle className="w-3 h-3" />,
  in_progress: <Clock className="w-3 h-3" />,
  done: <CheckCircle2 className="w-3 h-3" />,
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-amber-100 text-amber-800 border-amber-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  done: "bg-green-100 text-green-800 border-green-200",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[status] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}>
      {STATUS_ICONS[status]}
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export default function FragebogenAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Link senden form state
  const [brautpaarName, setBrautpaarName] = useState("");
  const [email, setEmail] = useState("");

  const { data: submissions = [], isLoading } = useQuery<Submission[]>({
    queryKey: ["questionnaire-submissions"],
    queryFn: async () => {
      const res = await fetch("/api/questionnaire/submissions");
      if (!res.ok) throw new Error("Fehler beim Laden der Fragebögen.");
      return res.json() as Promise<Submission[]>;
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/questionnaire/submissions/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Fehler beim Aktualisieren.");
      return res.json();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["questionnaire-submissions"] });
    },
    onError: () => {
      toast({ title: "Fehler", description: "Status konnte nicht geändert werden.", variant: "destructive" });
    },
  });

  const sendLinkMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/questionnaire/send-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brautpaarName, email }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? "Fehler beim Senden.");
      }
      return res.json() as Promise<{ success: boolean; message: string }>;
    },
    onSuccess: (data) => {
      toast({ title: "Link gesendet!", description: data.message });
      setBrautpaarName("");
      setEmail("");
    },
    onError: (err) => {
      toast({ title: "Fehler", description: err instanceof Error ? err.message : "Unbekannter Fehler.", variant: "destructive" });
    },
  });

  const handleSendLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brautpaarName.trim() || !email.trim()) return;
    sendLinkMutation.mutate();
  };

  const stats = {
    total: submissions.length,
    open: submissions.filter((s) => s.status === "open").length,
    inProgress: submissions.filter((s) => s.status === "in_progress").length,
    done: submissions.filter((s) => s.status === "done").length,
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <ClipboardList className="w-6 h-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Online Fragebogen</h1>
          <p className="text-sm text-muted-foreground">Eingehende Fragebögen verwalten &amp; Link an Brautpaare senden</p>
        </div>
      </div>

      {/* Send link card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            Fragebogen-Link an Brautpaar senden
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendLink} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[180px] space-y-1">
              <Label htmlFor="brautpaarName">Name des Brautpaares</Label>
              <Input
                id="brautpaarName"
                placeholder="z. B. Julia & Markus"
                value={brautpaarName}
                onChange={(e) => setBrautpaarName(e.target.value)}
                required
              />
            </div>
            <div className="flex-1 min-w-[200px] space-y-1">
              <Label htmlFor="coupleEmail">E-Mail-Adresse</Label>
              <Input
                id="coupleEmail"
                type="email"
                placeholder="brautpaar@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={sendLinkMutation.isPending} className="gap-2">
              <Send className="w-4 h-4" />
              {sendLinkMutation.isPending ? "Wird gesendet…" : "Link senden"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Gesamt", value: stats.total, color: "text-foreground" },
          { label: "Offen", value: stats.open, color: "text-amber-600" },
          { label: "In Bearbeitung", value: stats.inProgress, color: "text-blue-600" },
          { label: "Erledigt", value: stats.done, color: "text-green-600" },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Submissions table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Eingegangene Fragebögen</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Wird geladen…</div>
          ) : submissions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Noch keine Fragebögen eingegangen.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Brautpaar</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Datum</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Location</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">E-Mail</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Eingegangen</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s, i) => (
                    <tr key={s.id} className={`border-b border-border last:border-0 ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                      <td className="px-4 py-3 font-medium">{s.brautpaar}</td>
                      <td className="px-4 py-3 text-muted-foreground">{s.datum ?? "–"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{s.location ?? "–"}</td>
                      <td className="px-4 py-3">
                        {s.emailSent === "true" ? (
                          <span className="inline-flex items-center gap-1 text-green-600 text-xs">
                            <Mail className="w-3 h-3" /> Gesendet
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">–</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {new Date(s.createdAt).toLocaleDateString("de-DE", {
                          day: "2-digit", month: "2-digit", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          value={s.status}
                          onValueChange={(val) => statusMutation.mutate({ id: s.id, status: val })}
                        >
                          <SelectTrigger className="w-36 h-7 text-xs">
                            <SelectValue>
                              <StatusBadge status={s.status} />
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open"><StatusBadge status="open" /></SelectItem>
                            <SelectItem value="in_progress"><StatusBadge status="in_progress" /></SelectItem>
                            <SelectItem value="done"><StatusBadge status="done" /></SelectItem>
                          </SelectContent>
                        </Select>
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
