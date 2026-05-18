import { Link, useLocation } from "wouter";
import { Music2, Home, FileText, Inbox, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";

const navItems: { href: string; label: string; icon: React.ComponentType<{ className?: string }>; exact?: boolean }[] = [
  { href: "/portal", label: "Startseite", icon: Home, exact: true },
  { href: "/portal/formulare", label: "Formulare", icon: FileText },
  { href: "/portal/eingereicht", label: "Übermittelte Formulare", icon: Inbox },
];

export function CustomerShell({ children, onLogout }: { children: React.ReactNode; onLogout: () => void }) {
  const [location] = useLocation();
  const { customer } = useCustomerAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center gap-4 h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
              <Music2 className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <span className="text-sm font-bold tracking-widest uppercase text-gray-800">NIWE Weddings</span>
          </div>

          <nav className="flex-1 flex items-center gap-1 ml-4">
            {navItems.map(({ href, label, icon: Icon, exact }) => {
              const isActive = exact ? location === href : (location === href || location.startsWith(href + "/"));
              return (
                <Link key={href} href={href}>
                  <div className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer",
                    isActive
                      ? "bg-amber-50 text-amber-700"
                      : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  )}>
                    <Icon className="w-4 h-4 shrink-0" />
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
      </footer>
    </div>
  );
}
