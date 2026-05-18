import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Mail, ClipboardList, CheckCircle2, Clock, Circle,
  Send, Link2, ChevronDown, ChevronUp,
} from "lucide-react";

interface Submission {
  id: number;
  brautpaar: string;
  datum: string | null;
  location: string | null;
  status: "open" | "in_progress" | "done";
  emailSent: string;
  createdAt: string;
}

interface SubmissionDetail extends Submission {
  formData: Record<string, unknown>;
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

// ── Field display helpers ─────────────────────────────────
const GENRES = ["Pop", "Rock", "Charts / Aktuelles", "Oldies (60er–80er)", "90er / 2000er",
  "Hip-Hop / R'n'B", "House / EDM", "Schlager", "Disco / Funk", "Soul / Motown",
  "Jazz / Swing", "Klassik", "Volksmusik", "Internationale Musik", "Sonstiges"];

const ALTER_MAP: Record<string, string> = {
  "unter20": "unter 20", "20bis35": "20–35", "35bis50": "35–50", "50plus": "50+",
};

function field(label: string, value: unknown) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  const display = Array.isArray(value) ? value.join(", ") : String(value);
  if (!display.trim() || display === "undefined") return null;
  return { label, display };
}

function parseFormData(fd: Record<string, unknown>) {
  const genres = GENRES.filter((g) => fd[`genre-${g}`] === "true" || fd[`genre-${g}`] === true);
  const alter = Object.entries(ALTER_MAP)
    .filter(([k]) => fd[`alter-${k}`] === "true" || fd[`alter-${k}`] === true)
    .map(([, v]) => v);
  const songs = [1, 2, 3, 4, 5]
    .map((n) => fd[`lieblingssong_${n}`])
    .filter(Boolean)
    .join(", ");

  // Also check selectedGenres/selectedAlter arrays from state (new format)
  const selGenres = Array.isArray(fd.selectedGenres) ? (fd.selectedGenres as string[]) : [];
  const selAlter = Array.isArray(fd.selectedAlter) ? (fd.selectedAlter as string[]).map((a) => ALTER_MAP[a] ?? a) : [];

  const allGenres = [...new Set([...genres, ...selGenres])];
  const allAlter = [...new Set([...alter, ...selAlter])];

  return {
    allgemein: [
      field("Anzahl der Gäste", fd.gaeste),
      field("Durchschnittsalter", allAlter.length ? allAlter : fd.alter),
      field("Altersverteilung", fd.altersverteilung),
    ].filter(Boolean) as { label: string; display: string }[],

    musik: [
      field("Bevorzugte Genres", allGenres.length ? allGenres : null),
      field("Zu vermeiden", fd.vermeiden),
      field("Lieblingssongs / Künstler", songs || fd.lieblingssongs),
      field("Verbotene Songs", fd.verboten),
    ].filter(Boolean) as { label: string; display: string }[],

    verlauf: [
      field("Musik beim Sektempfang", fd.sektempfangMusik),
      field("Stil Sektempfang", fd.sektStil),
      field("Musik beim Essen", fd.essensMusik),
      field("Stil beim Essen", fd.essensStil),
      field("Eröffnungstanz", fd.eröffnungstanz),
      field("Eröffnungstanz Song", fd.eröffnungSong),
      field("Art des Tanzes", Array.isArray(fd.eröffnungTyp) ? (fd.eröffnungTyp as string[]).join(", ") : fd.eröffnungTyp),
      field("Einzug", fd.einzug),
      field("Torte", fd.torte),
      field("Brautstraußwurf", fd.brautstrauss),
      field("Sonstige Programmpunkte", fd.sonstigePunkte),
      field("Gastwünsche", fd.gästeWünsche),
    ].filter(Boolean) as { label: string; display: string }[],

    technik: [
      field("Musik ab", fd.musikAb),
      field("Aufbau ab", fd.aufbauAb),
      field("Musik bis", fd.musikBis),
      field("Lautstärkeregeln", fd.lautstärke),
      field("Lautstärkeregel Detail", fd.lautstärkeRegel),
      field("Technik vorhanden", fd.technikVorhanden),
      field("Location Besonderheiten", fd.locationBes),
      field("Strom", fd.strom),
      field("Aufbau Info", fd.aufbauInfo),
      field("Musikanschlüsse", fd.musikanschluss),
      field("Bühne", fd.buehne),
    ].filter(Boolean) as { label: string; display: string }[],

    weiteres: [
      field("Besondere Wünsche", fd.besondereWuensche),
      field("Sonstige Hinweise", fd.sonstigeHinweise),
    ].filter(Boolean) as { label: string; display: string }[],
  };
}

function Section({ title, rows }: { title: string; rows: { label: string; display: string }[] }) {
  if (rows.length === 0) return null;
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">{title}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5">
        {rows.map(({ label, display }) => (
          <div key={label} className="flex gap-2 text-sm">
            <span className="text-muted-foreground min-w-[160px] shrink-0">{label}</span>
            <span className="font-medium text-foreground">{display}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailPanel({ id }: { id: number }) {
  const { data, isLoading, isError } = useQuery<SubmissionDetail>({
    queryKey: ["questionnaire-detail", id],
    queryFn: async () => {
      const res = await fetch(`/api/questionnaire/submissions/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Fehler beim Laden.");
      return res.json() as Promise<SubmissionDetail>;
    },
  });

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Wird geladen…</div>;
  if (isError || !data) return <div className="p-6 text-sm text-destructive">Fehler beim Laden der Details.</div>;

  const sections = parseFormData(data.formData);
  const hasContent = Object.values(sections).some((s) => s.length > 0);

  return (
    <div className="px-6 py-5 bg-muted/20 border-t border-border space-y-5">
      {!hasContent ? (
        <p className="text-sm text-muted-foreground">Keine weiteren Angaben im Fragebogen.</p>
      ) : (
        <>
          <Section title="Allgemeine Angaben" rows={sections.allgemein} />
          <Section title="Musikgeschmack" rows={sections.musik} />
          <Section title="Musikverlauf der Feier" rows={sections.verlauf} />
          <Section title="Technik & Ablauf" rows={sections.technik} />
          <Section title="Weitere Hinweise" rows={sections.weiteres} />
        </>
      )}
    </div>
  );
}

export default function FragebogenAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [brautpaarName, setBrautpaarName] = useState("");
  const [email, setEmail] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: submissions = [], isLoading } = useQuery<Submission[]>({
    queryKey: ["questionnaire-submissions"],
    queryFn: async () => {
      const res = await fetch("/api/questionnaire/submissions", { credentials: "include" });
      if (!res.ok) throw new Error("Fehler beim Laden der Fragebögen.");
      return res.json() as Promise<Submission[]>;
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/questionnaire/submissions/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
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
        credentials: "include",
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

      {/* Send link */}
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
              <Input id="brautpaarName" placeholder="z. B. Julia & Markus" value={brautpaarName}
                onChange={(e) => setBrautpaarName(e.target.value)} required />
            </div>
            <div className="flex-1 min-w-[200px] space-y-1">
              <Label htmlFor="coupleEmail">E-Mail-Adresse</Label>
              <Input id="coupleEmail" type="email" placeholder="brautpaar@example.com" value={email}
                onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <Button type="submit" disabled={sendLinkMutation.isPending} className="gap-2">
              <Send className="w-4 h-4" />
              {sendLinkMutation.isPending ? "Wird gesendet…" : "Link senden"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Stats */}
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

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Eingegangene Fragebögen</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Wird geladen…</div>
          ) : submissions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Noch keine Fragebögen eingegangen.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="w-8 px-3 py-3" />
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Brautpaar</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Datum</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Location</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">E-Mail</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Eingegangen</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s, i) => {
                    const isExpanded = expandedId === s.id;
                    return (
                      <>
                        <tr
                          key={s.id}
                          className={`border-b border-border cursor-pointer transition-colors ${isExpanded ? "bg-muted/30" : i % 2 === 0 ? "hover:bg-muted/10" : "bg-muted/10 hover:bg-muted/20"}`}
                          onClick={() => setExpandedId(isExpanded ? null : s.id)}
                        >
                          <td className="px-3 py-3 text-muted-foreground">
                            {isExpanded
                              ? <ChevronUp className="w-4 h-4" />
                              : <ChevronDown className="w-4 h-4" />}
                          </td>
                          <td className="px-4 py-3 font-medium">{s.brautpaar}</td>
                          <td className="px-4 py-3 text-muted-foreground">{s.datum ?? "–"}</td>
                          <td className="px-4 py-3 text-muted-foreground">{s.location ?? "–"}</td>
                          <td className="px-4 py-3">
                            {s.emailSent === "true"
                              ? <span className="inline-flex items-center gap-1 text-green-600 text-xs"><Mail className="w-3 h-3" /> Gesendet</span>
                              : <span className="text-xs text-muted-foreground">–</span>}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">
                            {new Date(s.createdAt).toLocaleDateString("de-DE", {
                              day: "2-digit", month: "2-digit", year: "numeric",
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </td>
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <Select
                              value={s.status}
                              onValueChange={(val) => statusMutation.mutate({ id: s.id, status: val })}
                            >
                              <SelectTrigger className="w-36 h-7 text-xs">
                                <SelectValue><StatusBadge status={s.status} /></SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="open"><StatusBadge status="open" /></SelectItem>
                                <SelectItem value="in_progress"><StatusBadge status="in_progress" /></SelectItem>
                                <SelectItem value="done"><StatusBadge status="done" /></SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${s.id}-detail`}>
                            <td colSpan={7} className="p-0">
                              <DetailPanel id={s.id} />
                            </td>
                          </tr>
                        )}
                      </>
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
