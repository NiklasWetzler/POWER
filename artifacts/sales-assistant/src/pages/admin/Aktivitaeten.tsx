import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Activity as ActivityIcon, LogIn, UserPlus, UserCog, Trash2, Mail,
  MessageCircle, CalendarCheck, CalendarX, CalendarClock, ShieldX, ShieldCheck, Key,
} from "lucide-react";

interface ActivityRow {
  id: number;
  adminId: number | null;
  adminName: string;
  action: string;
  targetType: string | null;
  targetId: number | null;
  targetLabel: string | null;
  description: string | null;
  createdAt: string;
}

interface ByAdmin {
  adminId: number | null;
  adminName: string;
  total: number;
  lastAt: string | null;
}

function actionMeta(a: string): { label: string; icon: typeof ActivityIcon; color: string } {
  switch (a) {
    case "auth.login":            return { label: "Login",                 icon: LogIn,         color: "text-emerald-600" };
    case "auth.failed_login":     return { label: "Fehlgeschlagener Login", icon: ShieldX,      color: "text-red-600" };
    case "customer.created":      return { label: "Kunde angelegt",         icon: UserPlus,     color: "text-emerald-600" };
    case "customer.updated":      return { label: "Kunde bearbeitet",       icon: UserCog,      color: "text-blue-600" };
    case "customer.deleted":      return { label: "Kunde gelöscht",         icon: Trash2,       color: "text-red-600" };
    case "customer_message.sent": return { label: "Nachricht gesendet",     icon: Mail,         color: "text-blue-600" };
    case "chat.sent":             return { label: "Chat-Nachricht",         icon: MessageCircle, color: "text-amber-600" };
    case "appointment.accepted":  return { label: "Termin angenommen",      icon: CalendarCheck, color: "text-emerald-600" };
    case "appointment.declined":  return { label: "Termin abgelehnt",       icon: CalendarX,    color: "text-red-600" };
    case "appointment.proposed":  return { label: "Termin vorgeschlagen",   icon: CalendarClock, color: "text-blue-600" };
    case "staff.created":         return { label: "Mitarbeiter angelegt",   icon: UserPlus,     color: "text-emerald-600" };
    case "staff.invited":         return { label: "Mitarbeiter eingeladen", icon: Mail,         color: "text-blue-600" };
    case "staff.deleted":         return { label: "Mitarbeiter gelöscht",   icon: Trash2,       color: "text-red-600" };
    case "staff.password_set":    return { label: "Passwort gesetzt",       icon: Key,          color: "text-emerald-600" };
    case "profile.updated":       return { label: "Profil aktualisiert",    icon: UserCog,      color: "text-gray-600" };
    default:                      return { label: a,                        icon: ActivityIcon,  color: "text-gray-500" };
  }
}

function fmt(iso: string): string {
  return new Date(iso).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
}

export default function Aktivitaeten() {
  const [filterAdminId, setFilterAdminId] = useState<number | "all">("all");

  const { data: byAdmin = [] } = useQuery<ByAdmin[]>({
    queryKey: ["admin-activity-by-admin"],
    queryFn: async () => {
      const r = await fetch("/api/admin/activity/by-admin", { credentials: "include" });
      if (!r.ok) throw new Error("Fehler");
      return r.json();
    },
    refetchInterval: 30000,
  });

  const { data: rows = [], isLoading } = useQuery<ActivityRow[]>({
    queryKey: ["admin-activity", filterAdminId],
    queryFn: async () => {
      const url = filterAdminId === "all"
        ? "/api/admin/activity?limit=200"
        : `/api/admin/activity?limit=200&adminId=${filterAdminId}`;
      const r = await fetch(url, { credentials: "include" });
      if (!r.ok) throw new Error("Fehler");
      return r.json();
    },
    refetchInterval: 15000,
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Aktivitäten</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Audit-Log aller wichtigen Aktionen im Admin-Bereich. Nur für NIWEWorker sichtbar.
        </p>
      </div>

      {/* Per-admin totals */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterAdminId("all")}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            filterAdminId === "all"
              ? "border-amber-500 bg-amber-50 text-amber-700"
              : "border-gray-200 text-gray-600 hover:bg-gray-50",
          )}
        >
          <ShieldCheck className="w-3.5 h-3.5" /> Alle
          <span className="text-gray-400">·</span>
          <span className="font-bold">{byAdmin.reduce((s, r) => s + r.total, 0)}</span>
        </button>
        {byAdmin.map((b) => (
          <button
            key={b.adminId ?? `name-${b.adminName}`}
            onClick={() => b.adminId && setFilterAdminId(b.adminId)}
            disabled={!b.adminId}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              filterAdminId === b.adminId
                ? "border-amber-500 bg-amber-50 text-amber-700"
                : "border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed",
            )}
          >
            {b.adminName}
            <span className="text-gray-400">·</span>
            <span className="font-bold">{b.total}</span>
          </button>
        ))}
      </div>

      {/* Activity log */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-sm text-muted-foreground text-center">Wird geladen…</div>
          ) : rows.length === 0 ? (
            <div className="p-8 text-sm text-muted-foreground text-center">Keine Einträge.</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {rows.map((r) => {
                const meta = actionMeta(r.action);
                const Icon = meta.icon;
                return (
                  <li key={r.id} className="flex items-start gap-3 p-4">
                    <div className={cn("mt-0.5 rounded-full bg-gray-100 p-2", meta.color)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{r.adminName}</span>{" "}
                        <span className="text-gray-500">— {meta.label}</span>
                        {r.targetLabel && (
                          <>
                            : <span className="font-medium text-gray-800">{r.targetLabel}</span>
                          </>
                        )}
                      </p>
                      {r.description && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{r.description}</p>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-400 shrink-0 mt-1">{fmt(r.createdAt)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
