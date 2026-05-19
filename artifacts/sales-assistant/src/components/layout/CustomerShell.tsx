import { Link, useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Home, FileText, Inbox, Mail, LogOut, MessageCircle, Eye, ArrowLeft } from "lucide-react";
import { openCookieSettings } from "@/hooks/useCookieConsent";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { Logo } from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";

const navItems: { href: string; label: string; icon: React.ComponentType<{ className?: string }>; exact?: boolean; key?: string }[] = [
  { href: "/portal", label: "Startseite", icon: Home, exact: true },
  { href: "/portal/eingang", label: "Eingang", icon: Mail, key: "eingang" },
  { href: "/portal/kontakt", label: "Kontakt", icon: MessageCircle, key: "kontakt" },
  { href: "/portal/formulare", label: "Formulare", icon: FileText },
  { href: "/portal/eingereicht", label: "Übermittelte", icon: Inbox },
];

export function CustomerShell({ children, onLogout }: { children: React.ReactNode; onLogout: () => void }) {
  const [location, navigate] = useLocation();
  const { customer, preview, refresh } = useCustomerAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  const stopPreview = async () => {
    try {
      const r = await fetch("/api/admin/preview/stop", { method: "POST", credentials: "include" });
      if (!r.ok) throw new Error("Vorschau konnte nicht beendet werden.");
      await refresh();
      void qc.invalidateQueries();
      navigate("/admin/kundenansicht");
    } catch (e) {
      toast({
        title: "Fehler",
        description: e instanceof Error ? e.message : "Unbekannter Fehler.",
        variant: "destructive",
      });
    }
  };
  const { data: unread } = useQuery<{ count: number }>({
    queryKey: ["customer-unread-count"],
    queryFn: async () => {
      const res = await fetch("/api/customer/messages/unread-count", { credentials: "include" });
      if (!res.ok) return { count: 0 };
      return res.json() as Promise<{ count: number }>;
    },
    refetchInterval: 30000,
  });
  const unreadCount = unread?.count ?? 0;

  const { data: chatUnread } = useQuery<{ count: number }>({
    queryKey: ["customer-chat-unread"],
    queryFn: async () => {
      const res = await fetch("/api/customer/chat/unread-count", { credentials: "include" });
      if (!res.ok) return { count: 0 };
      return res.json() as Promise<{ count: number }>;
    },
    refetchInterval: 15000,
  });
  const chatUnreadCount = chatUnread?.count ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Preview banner: shown when a super-admin is impersonating a customer */}
      {preview && (
        <div className="bg-amber-500 text-white text-xs sm:text-sm sticky top-0 z-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Eye className="w-4 h-4 shrink-0" />
              <span className="truncate">
                <strong>Kundenansicht-Vorschau</strong>
                {customer ? <> als <strong>{customer.name}</strong></> : null}
                {" "}— alle Aktionen sind echt für diesen Kunden.
              </span>
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="bg-white text-amber-700 hover:bg-amber-50 h-7 px-2 shrink-0"
              onClick={() => void stopPreview()}
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              <span className="hidden sm:inline">Vorschau beenden</span>
              <span className="sm:hidden">Beenden</span>
            </Button>
          </div>
        </div>
      )}

      {/* Top nav */}
      <header className={cn("bg-white border-b border-gray-200 sticky z-10", preview ? "top-10" : "top-0")}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center gap-4 h-16">
          <Link href="/portal">
            <div className="cursor-pointer">
              <Logo size="sm" />
            </div>
          </Link>

          <nav className="flex-1 flex items-center gap-1 ml-4">
            {navItems.map(({ href, label, icon: Icon, exact, key }) => {
              const isActive = exact ? location === href : (location === href || location.startsWith(href + "/"));
              const badgeCount = key === "eingang" ? unreadCount : key === "kontakt" ? chatUnreadCount : 0;
              const showBadge = badgeCount > 0;
              return (
                <Link key={href} href={href}>
                  <div className={cn(
                    "relative flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer",
                    isActive
                      ? "bg-amber-50 text-amber-700"
                      : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  )}>
                    <div className="relative">
                      <Icon className="w-4 h-4 shrink-0" />
                      {showBadge && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                          {badgeCount > 9 ? "9+" : badgeCount}
                        </span>
                      )}
                    </div>
                    <span className="hidden sm:inline">{label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            {customer && (
              <span className="hidden sm:block text-xs text-gray-400 max-w-[140px] truncate">
                {customer.name}
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={onLogout}
              className="gap-1.5 text-gray-500 hover:text-gray-800 text-xs">
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Abmelden</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          {children}
        </div>
      </main>

      <footer className="border-t border-gray-200 py-4 text-center text-xs text-gray-400 space-x-3">
        <span>NIWE Weddings · NIWE Events · info@niwe-events.com</span>
        <Link href="/impressum">
          <span className="underline underline-offset-2 hover:text-gray-600 cursor-pointer transition-colors">Impressum</span>
        </Link>
        <Link href="/datenschutz">
          <span className="underline underline-offset-2 hover:text-gray-600 cursor-pointer transition-colors">Datenschutz</span>
        </Link>
        <Link href="/agb">
          <span className="underline underline-offset-2 hover:text-gray-600 cursor-pointer transition-colors">AGB &amp; Widerruf</span>
        </Link>
        <button onClick={openCookieSettings}
          className="underline underline-offset-2 hover:text-gray-600 cursor-pointer transition-colors">
          Cookie-Einstellungen
        </button>
      </footer>
    </div>
  );
}
