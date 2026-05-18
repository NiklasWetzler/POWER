import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, Circle, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Submission {
  id: number;
  brautpaar: string;
  datum: string | null;
  location: string | null;
  status: "open" | "in_progress" | "done";
  adminConfirmed: boolean;
  createdAt: string;
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  open: { label: "Offen", color: "bg-amber-100 text-amber-800 border-amber-200", icon: <Circle className="w-3 h-3" /> },
  in_progress: { label: "In Bearbeitung", color: "bg-blue-100 text-blue-800 border-blue-200", icon: <Clock className="w-3 h-3" /> },
  done: { label: "Abgeschlossen", color: "bg-green-100 text-green-800 border-green-200", icon: <CheckCircle2 className="w-3 h-3" /> },
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
          Hier seht ihr alle Formulare, die ihr eingereicht habt, und deren aktuellen Status.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Wird geladen…</p>
      ) : submissions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center space-y-2">
            <FileText className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-sm font-medium text-muted-foreground">Noch keine Formulare eingereicht.</p>
            <p className="text-xs text-muted-foreground">Geht zu "Formulare" um euren Musikfragebogen auszufüllen.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {submissions.map((s) => (
            <Card key={s.id} className="border-gray-200">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">{s.brautpaar}</p>
                      <span className="text-gray-300">·</span>
                      <p className="text-sm text-gray-500">Musikfragebogen</p>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {s.datum && (
                        <span className="text-xs text-gray-400">Hochzeit: {s.datum}</span>
                      )}
                      {s.location && (
                        <span className="text-xs text-gray-400">{s.location}</span>
                      )}
                      <span className="text-xs text-gray-400">
                        Eingereicht: {new Date(s.createdAt).toLocaleDateString("de-DE", {
                          day: "2-digit", month: "2-digit", year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={s.status} />
                    <ConfirmedBadge confirmed={s.adminConfirmed} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info box */}
      <Card className="bg-amber-50 border-amber-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-amber-800">Was bedeuten die Status?</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-amber-700 space-y-1">
          <p><span className="font-semibold">Ausstehend</span> — Euer Formular wurde eingereicht und wird noch von unserem Team geprüft.</p>
          <p><span className="font-semibold">Bestätigt</span> — Euer Formular wurde von uns bestätigt und in die Planung aufgenommen.</p>
        </CardContent>
      </Card>
    </div>
  );
}
