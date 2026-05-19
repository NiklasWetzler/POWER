import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  ClipboardList, CheckCircle2, Clock, Circle,
  Send, Link2, ChevronDown, ChevronUp, BadgeCheck,
  FileSignature, Music, Download,
} from "lucide-react";

type FormType = "dj-vertrag" | "musikfragebogen" | string;

interface Submission {
  id: number;
  formType: FormType;
  brautpaar: string;
  datum: string | null;
  location: string | null;
  status: "open" | "in_progress" | "done";
  emailSent: string;
  adminConfirmed: boolean;
  hasPdf: boolean;
  createdAt: string;
}

interface SubmissionDetail extends Submission {
  formData: Record<string, unknown>;
}

const FORM_TYPE_LABELS: Record<string, string> = {
  "dj-vertrag": "DJ-Vertrag",
  "musikfragebogen": "Musikfragebogen",
};

function FormTypeBadge({ type }: { type: FormType }) {
  const isContract = type === "dj-vertrag";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
        isContract
          ? "bg-amber-50 text-amber-800 border-amber-200"
          : "bg-indigo-50 text-indigo-800 border-indigo-200"
      }`}
    >
      {isContract ? <FileSignature className="w-3 h-3" /> : <Music className="w-3 h-3" />}
      {FORM_TYPE_LABELS[type] ?? type}
    </span>
  );
}

const STATUS_LABELS: Record<string, string> = {
  open: "Offen", in_progress: "In Bearbeitung", done: "Erledigt",
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

// ── Field helpers ─────────────────────────────────────────────
const GENRES = ["Pop","Rock","Charts / Aktuelles","Oldies (60er–80er)","90er / 2000er",
  "Hip-Hop / R'n'B","House / EDM","Schlager","Disco / Funk","Soul / Motown",
  "Jazz / Swing","Klassik","Volksmusik","Internationale Musik","Sonstiges"];
const ALTER_MAP: Record<string, string> = {
  "unter20":"unter 20","20bis35":"20–35","35bis50":"35–50","50plus":"50+",
};

function field(label: string, value: unknown) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  const display = Array.isArray(value) ? value.join(", ") : String(value);
  if (!display.trim() || display === "undefined") return null;
  return { label, display };
}

function parseFormData(fd: Record<string, unknown>) {
  const genres = GENRES.filter((g) => fd[`genre-${g}`]==="true"||fd[`genre-${g}`]===true);
  const selGenres = Array.isArray(fd.selectedGenres) ? (fd.selectedGenres as string[]) : [];
  const allGenres = [...new Set([...genres,...selGenres])];
  const alter = Object.entries(ALTER_MAP).filter(([k])=>fd[`alter-${k}`]==="true"||fd[`alter-${k}`]===true).map(([,v])=>v);
  const selAlter = Array.isArray(fd.selectedAlter)?(fd.selectedAlter as string[]).map((a)=>ALTER_MAP[a]??a):[];
  const allAlter = [...new Set([...alter,...selAlter])];
  const songs=[1,2,3,4,5].map((n)=>fd[`lieblingssong_${n}`]).filter(Boolean).join(", ");

  return {
    allgemein: [field("Anzahl Gäste",fd.gaeste),field("Durchschnittsalter",allAlter.length?allAlter:null),field("Altersverteilung",fd.altersverteilung)].filter(Boolean) as {label:string;display:string}[],
    musik:[field("Genres",allGenres.length?allGenres:null),field("Zu vermeiden",fd.vermeiden),field("Lieblingssongs",songs||fd.lieblingssongs),field("Spotify-Playlist",fd.spotifyPlaylist),field("Verboten",fd.verboten)].filter(Boolean) as {label:string;display:string}[],
    verlauf:[field("Sektempfang",fd.sektempfangMusik),field("Sektempfang Stil",fd.sektStil),field("Essen",fd.essensMusik),field("Essen Stil",fd.essensStil),field("Eröffnungstanz",fd.eröffnungstanz),field("Eröffnungssong",fd.eröffnungSong),field("Art des Tanzes",Array.isArray(fd.eröffnungTyp)?(fd.eröffnungTyp as string[]).join(", "):fd.eröffnungTyp),field("Einzug",fd.einzug),field("Torte",fd.torte),field("Brautstraußwurf",fd.brautstrauss),field("Sonstige Punkte",fd.sonstigePunkte),field("Gastwünsche",fd.gästeWünsche)].filter(Boolean) as {label:string;display:string}[],
    technik:[field("Musik ab",fd.musikAb),field("Aufbau ab",fd.aufbauAb),field("Musik bis",fd.musikBis),field("Lautstärke",fd.lautstärke),field("Technik",fd.technikVorhanden),field("Location",fd.locationBes),field("Bühne",fd.buehne)].filter(Boolean) as {label:string;display:string}[],
    weiteres:[field("Besondere Wünsche",fd.besondereWuensche),field("Sonstiges",fd.sonstigeHinweise)].filter(Boolean) as {label:string;display:string}[],
  };
}

function Section({ title, rows }: { title: string; rows:{label:string;display:string}[] }) {
  if (!rows.length) return null;
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">{title}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5">
        {rows.map(({label,display})=>(
          <div key={label} className="flex gap-2 text-sm">
            <span className="text-muted-foreground min-w-[150px] shrink-0">{label}</span>
            <span className="font-medium">{display}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContractDetailPanel({ data }: { data: SubmissionDetail }) {
  const fd = data.formData as Record<string, string | undefined>;
  const rows: { label: string; display: string }[] = [
    fd.auftraggeberName ? { label: "Auftraggeber", display: fd.auftraggeberName } : null,
    fd.strasse ? { label: "Straße & Nr.", display: fd.strasse } : null,
    (fd.plz || fd.ort)
      ? { label: "PLZ / Ort", display: `${fd.plz ?? ""} ${fd.ort ?? ""}`.trim() }
      : null,
    fd.telefon ? { label: "Telefon", display: fd.telefon } : null,
    fd.email ? { label: "E-Mail", display: fd.email } : null,
    fd.veranstaltungsort ? { label: "Veranstaltungsort", display: fd.veranstaltungsort } : null,
    fd.datum ? { label: "Datum", display: fd.datum } : null,
  ].filter(Boolean) as { label: string; display: string }[];

  return (
    <div className="px-6 py-5 bg-muted/20 border-t border-border space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            Unterzeichneter DJ-Vertrag
          </p>
          <p className="text-xs text-muted-foreground">
            Eingegangen am{" "}
            {new Date(data.createdAt).toLocaleString("de-DE", {
              day: "2-digit", month: "2-digit", year: "numeric",
              hour: "2-digit", minute: "2-digit",
            })}
            {" Uhr"}
          </p>
        </div>
        {data.hasPdf && (
          <Button asChild size="sm" className="gap-2">
            <a
              href={`/api/questionnaire/submissions/${data.id}/pdf`}
              target="_blank"
              rel="noreferrer"
            >
              <Download className="w-4 h-4" />
              Signierten Vertrag (PDF) herunterladen
            </a>
          </Button>
        )}
      </div>

      <Section title="Vertragsdaten" rows={rows} />

      {!data.hasPdf && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
          Für diesen Vertrag ist kein PDF gespeichert.
        </p>
      )}
    </div>
  );
}

function QuestionnaireDetailPanel({ data }: { data: SubmissionDetail }) {
  const s = parseFormData(data.formData);
  const hasContent = Object.values(s).some((r) => r.length > 0);

  return (
    <div className="px-6 py-5 bg-muted/20 border-t border-border space-y-5">
      {!hasContent
        ? <p className="text-sm text-muted-foreground">Keine weiteren Angaben vorhanden.</p>
        : <>
            <Section title="Allgemeine Angaben" rows={s.allgemein} />
            <Section title="Musikgeschmack" rows={s.musik} />
            <Section title="Musikverlauf" rows={s.verlauf} />
            <Section title="Technik & Ablauf" rows={s.technik} />
            <Section title="Weitere Hinweise" rows={s.weiteres} />
          </>
      }
    </div>
  );
}

function DetailPanel({ id }: { id: number }) {
  const { data, isLoading, isError } = useQuery<SubmissionDetail>({
    queryKey: ["questionnaire-detail", id],
    queryFn: async () => {
      const res = await fetch(`/api/questionnaire/submissions/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Fehler");
      return res.json() as Promise<SubmissionDetail>;
    },
  });

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Wird geladen…</div>;
  if (isError || !data) return <div className="p-6 text-sm text-destructive">Fehler beim Laden.</div>;

  return data.formType === "dj-vertrag"
    ? <ContractDetailPanel data={data} />
    : <QuestionnaireDetailPanel data={data} />;
}

export default function FragebogenAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [brautpaarName, setBrautpaarName] = useState("");
  const [email, setEmail] = useState("");
  const [expandedId, setExpandedId] = useState<number|null>(null);
  const [tab, setTab] = useState<"dj-vertrag" | "musikfragebogen">("dj-vertrag");

  const { data: allSubmissions = [], isLoading } = useQuery<Submission[]>({
    queryKey: ["questionnaire-submissions"],
    queryFn: async () => {
      const res = await fetch("/api/questionnaire/submissions", { credentials: "include" });
      if (!res.ok) throw new Error("Fehler beim Laden.");
      return res.json() as Promise<Submission[]>;
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/questionnaire/submissions/${id}/status`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Fehler");
      return res.json();
    },
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["questionnaire-submissions"] }); },
    onError: () => { toast({ title: "Fehler", description: "Status konnte nicht geändert werden.", variant: "destructive" }); },
  });

  const confirmMutation = useMutation({
    mutationFn: async ({ id, confirmed }: { id: number; confirmed: boolean }) => {
      const res = await fetch(`/api/questionnaire/submissions/${id}/confirm`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify({ confirmed }),
      });
      if (!res.ok) throw new Error("Fehler");
      return res.json();
    },
    onSuccess: (_data, { confirmed }) => {
      void queryClient.invalidateQueries({ queryKey: ["questionnaire-submissions"] });
      toast({ title: confirmed ? "Fragebogen bestätigt" : "Bestätigung zurückgenommen" });
    },
    onError: () => { toast({ title: "Fehler", description: "Bestätigung konnte nicht gespeichert werden.", variant: "destructive" }); },
  });

  const sendLinkMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/questionnaire/send-link", {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify({ brautpaarName, email }),
      });
      if (!res.ok) { const b = await res.json().catch(()=>({})) as {error?:string}; throw new Error(b.error??"Fehler"); }
      return res.json() as Promise<{ success: boolean; message: string }>;
    },
    onSuccess: (data) => { toast({ title: "Link gesendet!", description: data.message }); setBrautpaarName(""); setEmail(""); },
    onError: (err) => { toast({ title: "Fehler", description: err instanceof Error ? err.message : "Unbekannt.", variant: "destructive" }); },
  });

  const counts = {
    djVertrag: allSubmissions.filter((s) => s.formType === "dj-vertrag").length,
    musik: allSubmissions.filter((s) => s.formType === "musikfragebogen").length,
  };
  const submissions = allSubmissions.filter((s) => s.formType === tab);
  const stats = {
    total: submissions.length,
    open: submissions.filter((s)=>s.status==="open").length,
    inProgress: submissions.filter((s)=>s.status==="in_progress").length,
    done: submissions.filter((s)=>s.status==="done").length,
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <ClipboardList className="w-6 h-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Online Fragebogen</h1>
          <p className="text-sm text-muted-foreground">Eingehende Fragebögen verwalten &amp; bestätigen</p>
        </div>
      </div>

      {/* Type tabs */}
      <div className="flex gap-1 border-b border-border">
        {([
          { id: "dj-vertrag" as const, label: "Booking-Verträge", icon: <FileSignature className="w-4 h-4" />, count: counts.djVertrag },
          { id: "musikfragebogen" as const, label: "Musikfragebögen", icon: <Music className="w-4 h-4" />, count: counts.musik },
        ]).map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setExpandedId(null); }}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors inline-flex items-center gap-1.5 ${
                active ? "border-amber-500 text-amber-700" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.icon}
              {t.label}
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                active ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground"
              }`}>
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Send link */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="w-4 h-4" /> Fragebogen-Link an Brautpaar senden
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e)=>{e.preventDefault();if(!brautpaarName.trim()||!email.trim())return;sendLinkMutation.mutate();}} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[180px] space-y-1">
              <Label htmlFor="bp">Name des Brautpaares</Label>
              <Input id="bp" placeholder="Julia & Markus" value={brautpaarName} onChange={(e)=>setBrautpaarName(e.target.value)} required />
            </div>
            <div className="flex-1 min-w-[200px] space-y-1">
              <Label htmlFor="em">E-Mail-Adresse</Label>
              <Input id="em" type="email" placeholder="brautpaar@example.com" value={email} onChange={(e)=>setEmail(e.target.value)} required />
            </div>
            <Button type="submit" disabled={sendLinkMutation.isPending} className="gap-2">
              <Send className="w-4 h-4" />
              {sendLinkMutation.isPending?"Wird gesendet…":"Link senden"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:"Gesamt", value:stats.total, color:"text-foreground" },
          { label:"Offen", value:stats.open, color:"text-amber-600" },
          { label:"In Bearbeitung", value:stats.inProgress, color:"text-blue-600" },
          { label:"Erledigt", value:stats.done, color:"text-green-600" },
        ].map((s)=>(
          <Card key={s.label} className="p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {tab === "dj-vertrag" ? "Eingegangene Booking-Verträge" : "Eingegangene Musikfragebögen"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Wird geladen…</div>
          ) : submissions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              {tab === "dj-vertrag"
                ? "Noch keine unterzeichneten Booking-Verträge eingegangen."
                : "Noch keine Musikfragebögen eingegangen."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="w-8 px-3 py-3" />
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Typ</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Brautpaar</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Datum</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Location</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">PDF</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Bestätigt</th>
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
                          className={`border-b border-border cursor-pointer transition-colors ${isExpanded?"bg-muted/30":i%2===0?"hover:bg-muted/10":"bg-muted/10 hover:bg-muted/20"}`}
                          onClick={()=>setExpandedId(isExpanded?null:s.id)}
                        >
                          <td className="px-3 py-3 text-muted-foreground">
                            {isExpanded?<ChevronUp className="w-4 h-4" />:<ChevronDown className="w-4 h-4" />}
                          </td>
                          <td className="px-4 py-3"><FormTypeBadge type={s.formType} /></td>
                          <td className="px-4 py-3 font-medium">{s.brautpaar}</td>
                          <td className="px-4 py-3 text-muted-foreground">{s.datum??"–"}</td>
                          <td className="px-4 py-3 text-muted-foreground">{s.location??"–"}</td>
                          <td className="px-4 py-3" onClick={(e)=>e.stopPropagation()}>
                            {s.hasPdf ? (
                              <Button asChild size="sm" variant="outline" className="gap-1.5 h-7 text-xs">
                                <a
                                  href={`/api/questionnaire/submissions/${s.id}/pdf`}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  PDF
                                </a>
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">–</span>
                            )}
                          </td>
                          <td className="px-4 py-3" onClick={(e)=>e.stopPropagation()}>
                            <Button
                              size="sm"
                              variant={s.adminConfirmed?"default":"outline"}
                              className={`gap-1.5 h-7 text-xs ${s.adminConfirmed?"bg-emerald-600 hover:bg-emerald-700 text-white border-0":""}`}
                              disabled={confirmMutation.isPending}
                              onClick={()=>confirmMutation.mutate({id:s.id,confirmed:!s.adminConfirmed})}
                            >
                              <BadgeCheck className="w-3.5 h-3.5" />
                              {s.adminConfirmed?"Bestätigt":"Bestätigen"}
                            </Button>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">
                            {new Date(s.createdAt).toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"})}
                          </td>
                          <td className="px-4 py-3" onClick={(e)=>e.stopPropagation()}>
                            <Select value={s.status} onValueChange={(val)=>statusMutation.mutate({id:s.id,status:val})}>
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
                            <td colSpan={9} className="p-0">
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
