import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  LogOut,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  UserCog,
  UsersRound,
  Activity,
  Eye,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { AdminDailyBriefing } from "@/components/AdminDailyBriefing";
import { useAuth } from "@/hooks/useAuth";

interface NavItem {
  href: string;
  label: string;
  icon: typeof Users;
  badgeKey?: "kontakt";
  superAdminOnly?: boolean;
}

const baseNavItems: NavItem[] = [
  { href: "/admin/fragebogen", label: "Fragebögen", icon: ClipboardList },
  { href: "/admin/kontakt", label: "Kontakt", icon: MessageCircle, badgeKey: "kontakt" },
  { href: "/admin/kunden", label: "Kunden", icon: Users },
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

const adminSelfItems: NavItem[] = [
  { href: "/admin/profil", label: "Profil", icon: UserCog },
];

const superAdminItems: NavItem[] = [
  { href: "/admin/kundenansicht", label: "Kundenansicht", icon: Eye, superAdminOnly: true },
  { href: "/admin/team", label: "Mitarbeiter", icon: UsersRound, superAdminOnly: true },
  { href: "/admin/aktivitaeten", label: "Aktivitäten", icon: Activity, superAdminOnly: true },
];

function AdminSidebar({
  onLogout,
  collapsed,
  onToggle,
}: {
  onLogout?: () => void;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const [location] = useLocation();
  const { me } = useAuth();

  const items: NavItem[] = [
    ...baseNavItems,
    ...adminSelfItems,
    ...(me?.isSuperAdmin ? superAdminItems : []),
  ];

  const { data: kontaktBadge } = useQuery<{ count: number }>({
    queryKey: ["admin-kontakt-badge"],
    queryFn: async () => {
      const [chat, pend] = await Promise.all([
        fetch("/api/admin/chat/unread-count", { credentials: "include" }).then((r) => r.ok ? r.json() : { count: 0 }),
        fetch("/api/admin/appointments/pending-count", { credentials: "include" }).then((r) => r.ok ? r.json() : { count: 0 }),
      ]);
      return { count: (chat?.count ?? 0) + (pend?.count ?? 0) };
    },
    refetchInterval: 20000,
  });
  const kontaktCount = kontaktBadge?.count ?? 0;

  const initials = (me?.name ?? "?")
    .split(/\s+/)
    .map((p) => p.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside
      className={cn(
        "relative border-r border-border bg-gray-900 h-full flex flex-col flex-shrink-0 transition-[width] duration-200",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-label={collapsed ? "Menü ausklappen" : "Menü einklappen"}
        className="absolute -right-3 top-7 z-20 w-6 h-6 rounded-full bg-gray-800 border border-gray-700 text-gray-300 hover:bg-amber-500 hover:text-white hover:border-amber-500 flex items-center justify-center shadow-md transition-colors"
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      <div className={cn("border-b border-gray-800 flex flex-col items-center gap-2", collapsed ? "p-3" : "p-5")}>
        {collapsed ? (
          <Logo size="xs" variant="light" />
        ) : (
          <>
            <Logo size="sm" variant="light" />
            <p className="text-[10px] text-amber-400/70 tracking-[0.3em] uppercase">Admin</p>
          </>
        )}
      </div>

      {me && (
        <Link href="/admin/profil">
          <div
            title={collapsed ? `${me.name} – Profil bearbeiten` : undefined}
            className={cn(
              "mx-3 mt-3 mb-1 flex items-center gap-2 rounded-md cursor-pointer transition-colors",
              "hover:bg-gray-800/70",
              collapsed ? "justify-center p-1.5" : "p-2",
            )}
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-amber-500/20 text-amber-300 flex items-center justify-center font-semibold text-xs shrink-0 ring-1 ring-amber-500/30">
              {me.hasAvatar ? (
                <img
                  src={`/api/admin-avatars/${me.id}.jpg?v=${me.hasAvatar ? 1 : 0}`}
                  alt={me.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-100 truncate">{me.name}</p>
                <p className="text-[10px] text-gray-500 truncate">
                  {me.isSuperAdmin ? "NIWEWorker" : "Mitarbeiter"}
                </p>
              </div>
            )}
          </div>
        </Link>
      )}

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || location.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href}>
              <div
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md transition-all cursor-pointer text-sm",
                  collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2",
                  isActive
                    ? "bg-amber-500/20 text-amber-300 font-medium"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                )}
              >
                <div className="relative">
                  <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-amber-400" : "text-gray-500")} />
                  {item.badgeKey === "kontakt" && kontaktCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                      {kontaktCount > 9 ? "9+" : kontaktCount}
                    </span>
                  )}
                </div>
                {!collapsed && (
                  <span className="flex-1 flex items-center justify-between">
                    {item.label}
                    {item.badgeKey === "kontakt" && kontaktCount > 0 && (
                      <span className="ml-2 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                        {kontaktCount > 9 ? "9+" : kontaktCount}
                      </span>
                    )}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-800">
        {onLogout && (
          <Button
            variant="ghost"
            size="sm"
            title={collapsed ? "Abmelden" : undefined}
            className={cn(
              "w-full gap-2 text-gray-400 hover:text-white hover:bg-gray-800",
              collapsed ? "justify-center px-0" : "justify-start"
            )}
            onClick={onLogout}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && "Abmelden"}
          </Button>
        )}
      </div>
    </aside>
  );
}

export function AdminShell({
  children,
  onLogout,
}: {
  children: ReactNode;
  onLogout?: () => void;
}) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("niwe.admin.sidebarCollapsed") === "1";
  });

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem("niwe.admin.sidebarCollapsed", next ? "1" : "0");
      } catch {
        /* ignore storage errors */
      }
      return next;
    });
  };

  return (
    <div className="h-[100dvh] w-full flex bg-background text-foreground overflow-hidden">
      <AdminSidebar onLogout={onLogout} collapsed={collapsed} onToggle={toggle} />
      <main className="flex-1 overflow-y-auto">{children}</main>
      <AdminDailyBriefing />
    </div>
  );
}
