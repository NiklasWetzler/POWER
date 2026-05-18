import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Music2, FileText, ChevronRight, CheckCircle2, Clock, Circle, Inbox, MessageCircle, CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { NiceToKnow } from "@/components/portal/NiceToKnow";

// ── Countdown ─────────────────────────────────────────────────────────────────
function Countdown({ datum }: { datum: string }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const wedding = new Date(datum + "T00:00:00");
  wedding.setHours(0, 0, 0, 0);
  const diff = Math.round((wedding.getTime() - today.getTime()) / 86400000);

  let label: string;
  let sub: string;
  let urgent = false;

  if (diff < 0) {
    label = "Herzlichen Glückwunsch!";
    sub = "Eure Hochzeit hat bereits stattgefunden.";
  } else if (diff === 0) {
    label = "Heute ist es soweit!";
    sub = "Alles Gute zu eurer Hochzeit! 🎉";
    urgent = true;
  } else if (diff === 1) {
    label = "Noch 1 Tag";
    sub = "Morgen ist es soweit!";
    urgent = true;
  } else {
    label = `Noch ${diff} Tage`;
    sub = `bis zu eurer Hochzeit am ${new Date(datum + "T12:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}`;
  }

  return (
    <div className={`rounded-2xl px-8 py-7 flex flex-col items-center text-center shadow-sm border ${urgent ? "bg-amber-50 border-amber-200" : "bg-gray-900 border-gray-800"}`}>
      <div className={`text-5xl font-black tracking-tight mb-1 ${urgent ? "text-amber-600" : "text-white"}`}>
        {label}
      </div>
      <p className={`text-sm mt-1 ${urgent ? "text-amber-700" : "text-gray-400"}`}>{sub}</p>
    </div>
  );
}

// ── Forms list ────────────────────────────────────────────────────────────────
interface Form { id: string; title: string; description: string; icon: string }

function FormsSection() {
  const { data: forms = [], isLoading } = useQuery<Form[]>({
    queryKey: ["customer-forms"],
    queryFn: async () => {
      const res = await fetch("/api/customer/forms", { credentials: "include" });
      if (!res.ok) throw new Error("Fehler");
      return res.json() as Promise<Form[]>;
    },
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Wird geladen…</p>;

  return (
    <div className="space-y-3">
      {forms.map((form) => (
        <Link key={form.id} href={`/portal/formulare/${form.id}`}>
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-gray-200 group">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                <Music2 className="w-4.5 h-4.5 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 group-hover:text-amber-600 transition-colors text-sm">{form.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-1">{form.description}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-amber-500 shrink-0 transition-colors" />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

// ── Submissions list ──────────────────────────────────────────────────────────
interface Submission {
  id: number;
  brautpaar: string;
  datum: string | null;
  status: "open" | "in_progress" | "done";
  adminConfirmed: boolean;
  createdAt: string;
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  open:        { label: "Offen",          color: "bg-amber-100 text-amber-800 border-amber-200",   icon: <Circle className="w-3 h-3" /> },
  in_progress: { label: "In Bearbeitung", color: "bg-blue-100 text-blue-800 border-blue-200",     icon: <Clock className="w-3 h-3" /> },
  done:        { label: "Abgeschlossen",  color: "bg-green-100 text-green-800 border-green-200",  icon: <CheckCircle2 className="w-3 h-3" /> },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.open;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${s.color}`}>
      {s.icon}{s.label}
    </span>
  );
}

function SubmissionsSection() {
  const { data: submissions = [], isLoading } = useQuery<Submission[]>({
    queryKey: ["customer-submissions"],
    queryFn: async () => {
      const res = await fetch("/api/customer/submissions", { credentials: "include" });
      if (!res.ok) throw new Error("Fehler");
      return res.json() as Promise<Submission[]>;
    },
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Wird geladen…</p>;

  if (submissions.length === 0) {
    return (
      <Card className="border-dashed border-gray-200">
        <CardContent className="py-8 text-center">
          <Inbox className="w-7 h-7 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Noch keine Formulare eingereicht.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {submissions.map((s) => (
        <Card key={s.id} className="border-gray-200">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-gray-900">Musikfragebogen</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Eingereicht: {new Date(s.createdAt).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
              <StatusBadge status={s.status} />
              {s.adminConfirmed ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-emerald-50 text-emerald-700 border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />Bestätigt
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-gray-50 text-gray-500 border-gray-200">
                  <Clock className="w-3 h-3" />Ausstehend
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PortalHome() {
  const { customer } = useCustomerAuth();

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Willkommen{customer?.name ? `, ${customer.name}` : ""}!
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Hier findet ihr alles rund um eure Hochzeitsplanung mit NIWE Weddings.
        </p>
      </div>

      {/* Countdown — only if wedding date set */}
      {customer?.hochzeitsdatum && (
        <Countdown datum={customer.hochzeitsdatum} />
      )}

      {/* Formulare */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">Eure Formulare</h2>
          <Link href="/portal/formulare">
            <span className="text-xs text-amber-600 hover:text-amber-700 cursor-pointer">Alle anzeigen →</span>
          </Link>
        </div>
        <FormsSection />
      </section>

      {/* Übermittelte Formulare */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">Übermittelte Formulare</h2>
          <Link href="/portal/eingereicht">
            <span className="text-xs text-amber-600 hover:text-amber-700 cursor-pointer">Alle anzeigen →</span>
          </Link>
        </div>
        <SubmissionsSection />
      </section>

      {/* Nice to know */}
      <NiceToKnow />

      {/* Fragen / Kontakt — unten als ruhige CTA */}
      <section className="space-y-3 pt-2">
        <h2 className="text-base font-semibold text-gray-800">Habt ihr Fragen?</h2>
        <Link href="/portal/kontakt">
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-gray-200 group bg-gradient-to-br from-amber-50/60 to-white">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 group-hover:text-amber-700 transition-colors text-sm">
                  Schreibt uns oder vereinbart einen Beratungstermin
                </p>
                <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center gap-1"><MessageCircle className="w-3 h-3" />Chat mit uns</span>
                  <span className="inline-flex items-center gap-1"><CalendarDays className="w-3 h-3" />Termin anfragen</span>
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-amber-500 shrink-0 transition-colors" />
            </CardContent>
          </Card>
        </Link>
      </section>
    </div>
  );
}
