import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Sparkles, CalendarDays, Clock, MessageCircle, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Briefing {
  since: string;
  generatedAt: string;
  todaysAppointments: {
    id: number;
    finalAt: string | null;
    note: string | null;
    customerName: string;
  }[];
  pendingAppointments: {
    id: number;
    customerProposedAt: string | null;
    note: string | null;
    customerName: string;
  }[];
  unreadChat: {
    total: number;
    threads: { customerId: number; customerName: string; count: number }[];
  };
  newSubmissions: {
    id: number;
    brautpaar: string;
    formType: string;
    createdAt: string;
  }[];
}

const LAST_SEEN_KEY = "niwe.admin.lastSeenBriefing";
const PENDING_KEY = "niwe.admin.briefingPending";
const SINCE_KEY = "niwe.admin.briefingSince";

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return (
    d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }) +
    " · " +
    d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
  );
}

export function AdminDailyBriefing() {
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();

  // Show whenever a fresh admin login flagged a briefing as pending.
  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(PENDING_KEY) === "1") setOpen(true);
    } catch {
      /* ignore */
    }
  }, []);

  // Snapshot "since" once per mount so the query key is stable across renders.
  const sinceParam = useMemo(() => {
    try {
      const fromSession = window.sessionStorage.getItem(SINCE_KEY);
      if (fromSession) {
        const d = new Date(fromSession);
        if (!Number.isNaN(d.getTime())) return d.toISOString();
      }
      const fromLocal = window.localStorage.getItem(LAST_SEEN_KEY);
      if (fromLocal) {
        const d = new Date(fromLocal);
        if (!Number.isNaN(d.getTime())) return d.toISOString();
      }
    } catch {
      /* ignore */
    }
    // Fallback: yesterday at start of day.
    const fallback = new Date();
    fallback.setHours(0, 0, 0, 0);
    fallback.setDate(fallback.getDate() - 1);
    return fallback.toISOString();
  }, []);

  const { data, isLoading, isError, refetch } = useQuery<Briefing>({
    queryKey: ["admin-briefing", sinceParam],
    queryFn: async () => {
      const url = `/api/admin/briefing?since=${encodeURIComponent(sinceParam)}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Briefing konnte nicht geladen werden.");
      return res.json() as Promise<Briefing>;
    },
    enabled: open,
    staleTime: 60_000,
  });

  function dismiss() {
    try {
      window.localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
      window.sessionStorage.removeItem(PENDING_KEY);
      window.sessionStorage.removeItem(SINCE_KEY);
    } catch {
      /* ignore */
    }
    setOpen(false);
  }

  if (!open) return null;

  const hasAny =
    (data?.todaysAppointments.length ?? 0) > 0 ||
    (data?.pendingAppointments.length ?? 0) > 0 ||
    (data?.unreadChat.total ?? 0) > 0 ||
    (data?.newSubmissions.length ?? 0) > 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={dismiss}
      data-testid="admin-briefing-overlay"
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden my-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-[0.2em] text-amber-100">
              Was ist neu seit eurem letzten Besuch?
            </p>
            <h2 className="text-lg font-bold leading-tight">
              {new Date().toLocaleDateString("de-DE", {
                weekday: "long",
                day: "2-digit",
                month: "long",
              })}
            </h2>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Schließen"
            className="w-8 h-8 rounded-full hover:bg-white/15 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Wird geladen…</p>
          ) : isError ? (
            <div className="py-6 text-center space-y-3">
              <p className="text-sm text-red-700 font-medium">
                Briefing konnte nicht geladen werden.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => refetch()}
              >
                Erneut versuchen
              </Button>
            </div>
          ) : !hasAny ? (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-700 font-medium">Alles ruhig heute.</p>
              <p className="text-xs text-gray-500 mt-1">
                Keine Termine, keine offenen Anfragen, keine neuen Nachrichten oder Formulare.
              </p>
            </div>
          ) : (
            <>
              {/* Today's appointments */}
              <Section
                title="Termine heute"
                icon={<CalendarDays className="w-4 h-4" />}
                count={data?.todaysAppointments.length ?? 0}
                emptyText="Keine Termine heute."
              >
                {data?.todaysAppointments.map((a) => (
                  <Row
                    key={a.id}
                    primary={`${formatTime(a.finalAt)} · ${a.customerName}`}
                    secondary={a.note ?? undefined}
                    onClick={() => {
                      dismiss();
                      navigate("/admin/kontakt");
                    }}
                  />
                ))}
              </Section>

              {/* Pending appointment requests */}
              {(data?.pendingAppointments.length ?? 0) > 0 && (
                <Section
                  title="Offene Termin-Anfragen"
                  icon={<Clock className="w-4 h-4" />}
                  count={data?.pendingAppointments.length ?? 0}
                >
                  {data?.pendingAppointments.map((a) => (
                    <Row
                      key={a.id}
                      primary={a.customerName}
                      secondary={`Wunsch: ${formatDateTime(a.customerProposedAt)}`}
                      onClick={() => {
                        dismiss();
                        navigate("/admin/kontakt");
                      }}
                    />
                  ))}
                </Section>
              )}

              {/* Unread chat */}
              {(data?.unreadChat.total ?? 0) > 0 && (
                <Section
                  title="Neue Nachrichten"
                  icon={<MessageCircle className="w-4 h-4" />}
                  count={data?.unreadChat.total ?? 0}
                >
                  {data?.unreadChat.threads.map((t) => (
                    <Row
                      key={t.customerId}
                      primary={t.customerName}
                      secondary={`${t.count} ungelesene Nachricht${t.count === 1 ? "" : "en"}`}
                      onClick={() => {
                        dismiss();
                        navigate("/admin/kontakt");
                      }}
                    />
                  ))}
                </Section>
              )}

              {/* New submissions */}
              {(data?.newSubmissions.length ?? 0) > 0 && (
                <Section
                  title="Neue Formulare"
                  icon={<FileText className="w-4 h-4" />}
                  count={data?.newSubmissions.length ?? 0}
                >
                  {data?.newSubmissions.map((s) => (
                    <Row
                      key={s.id}
                      primary={s.brautpaar}
                      secondary={`Eingereicht ${formatDateTime(s.createdAt)}`}
                      onClick={() => {
                        dismiss();
                        navigate("/admin/fragebogen");
                      }}
                    />
                  ))}
                </Section>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
          <Button
            size="sm"
            onClick={dismiss}
            className="bg-amber-500 hover:bg-amber-600 text-white"
            data-testid="button-briefing-dismiss"
          >
            Verstanden
          </Button>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  count,
  emptyText,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  emptyText?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-amber-600">{icon}</span>
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        {count > 0 && (
          <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
            {count}
          </span>
        )}
      </div>
      {count === 0 ? (
        <p className="text-xs text-gray-400 pl-6">{emptyText}</p>
      ) : (
        <div className="space-y-1.5">{children}</div>
      )}
    </div>
  );
}

function Row({
  primary,
  secondary,
  onClick,
}: {
  primary: string;
  secondary?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left px-3 py-2 rounded-lg border border-gray-200 hover:border-amber-300 hover:bg-amber-50/50 transition-colors"
    >
      <p className="text-sm font-medium text-gray-900">{primary}</p>
      {secondary && <p className="text-xs text-gray-500 mt-0.5">{secondary}</p>}
    </button>
  );
}
