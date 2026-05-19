import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, Circle, FileText, Download, FileSignature, Music } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Submission {
  id: number;
  formType: "dj-vertrag" | "musikfragebogen" | string;
  brautpaar: string;
  datum: string | null;
  location: string | null;
  status: "open" | "in_progress" | "done";
  adminConfirmed: boolean;
  hasPdf: boolean;
  createdAt: string;
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  open: { label: "Offen", color: "bg-amber-50 text-amber-800 border-amber-200", icon: <Circle className="w-3 h-3" /> },
  in_progress: { label: "In Bearbeitung", color: "bg-blue-50 text-blue-800 border-blue-200", icon: <Clock className="w-3 h-3" /> },
  done: { label: "Abgeschlossen", color: "bg-emerald-50 text-emerald-800 border-emerald-200", icon: <CheckCircle2 className="w-3 h-3" /> },
};

const FORM_LABEL: Record<string, string> = {
  "dj-vertrag": "DJ-Booking Vertrag",
  "musikfragebogen": "Musiknachfragebogen",
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.open;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${s.color}`}>
      {s.icon}
      {s.label}
    </span>
  );
}

function ConfirmedBadge({ confirmed }: { confirmed: boolean }) {
  if (confirmed) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-emerald-50 text-emerald-700 border-emerald-200">
        <CheckCircle2 className="w-3 h-3" />
        Bestätigt
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-gray-50 text-gray-500 border-gray-200">
      <Clock className="w-3 h-3" />
      Ausstehend
    </span>
  );
}

function FormIcon({ type }: { type: string }) {
  const Icon = type === "dj-vertrag" ? FileSignature : type === "musikfragebogen" ? Music : FileText;
  return (
    <div className="w-11 h-11 rounded-xl bg-[#faf6ec] border border-[#e7d9b4] flex items-center justify-center shrink-0">
      <Icon className="w-5 h-5 text-[#c9a55a]" />
    </div>
  );
}

export default function UebermittelteFormulare() {
  const { data: submissions = [], isLoading } = useQuery<Submission[]>({
    queryKey: ["customer-submissions"],
    queryFn: async () => {
      const res = await fetch("/api/customer/submissions", { credentials: "include" });
      if (!res.ok) throw new Error("Fehler beim Laden.");
      return res.json() as Promise<Submission[]>;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Übermittelte Formulare</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Eure eingereichten Formulare auf einen Blick — inkl. PDF zum Herunterladen.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Wird geladen…</p>
      ) : submissions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center space-y-2">
            <FileText className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-sm font-medium text-muted-foreground">Noch keine Formulare eingereicht.</p>
            <p className="text-xs text-muted-foreground">Geht zu „Formulare", um euren Musiknachfragebogen auszufüllen.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {submissions.map((s) => {
            const title = FORM_LABEL[s.formType] ?? "Formular";
            return (
              <Card key={s.id} className="border-gray-200 hover:shadow-sm transition-shadow">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <FormIcon type={s.formType} />
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900">{title}</p>
                        <span className="text-gray-300">·</span>
                        <p className="text-sm text-gray-500 truncate">{s.brautpaar}</p>
                      </div>
                      <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-xs text-gray-500">
                        {s.datum && <span>Hochzeit: {s.datum}</span>}
                        {s.location && <span>· {s.location}</span>}
                        <span>· Eingereicht: {new Date(s.createdAt).toLocaleDateString("de-DE", {
                          day: "2-digit", month: "2-digit", year: "numeric",
                        })}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        <StatusBadge status={s.status} />
                        <ConfirmedBadge confirmed={s.adminConfirmed} />
                      </div>
                    </div>
                    {s.hasPdf && (
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="shrink-0 gap-1.5 border-[#e7d9b4] bg-[#faf6ec] hover:bg-[#f3eada] text-[#8a6a2a] hover:text-[#6f521e]"
                      >
                        <a
                          href={`/api/customer/submissions/${s.id}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          data-testid={`download-pdf-${s.id}`}
                        >
                          <Download className="w-4 h-4" />
                          PDF herunterladen
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Info box */}
      <Card className="bg-[#faf6ec] border-[#e7d9b4]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-[#8a6a2a]">Was bedeuten die Status?</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-[#6f521e] space-y-1">
          <p><span className="font-semibold">Ausstehend</span> — Euer Formular wurde eingereicht und wird noch von unserem Team geprüft.</p>
          <p><span className="font-semibold">Bestätigt</span> — Euer Formular wurde von uns bestätigt und in die Planung aufgenommen.</p>
        </CardContent>
      </Card>
    </div>
  );
}
