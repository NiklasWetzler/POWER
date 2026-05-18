import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

const navItems = [
  { href: "/admin/fragebogen", label: "Fragebögen", icon: ClipboardList },
  { href: "/admin/kunden", label: "Kunden", icon: Users },
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

function AdminSidebar({ onLogout }: { onLogout?: () => void }) {
  const [location] = useLocation();

  return (
    <aside className="w-60 border-r border-border bg-gray-900 h-full flex flex-col flex-shrink-0">
      <div className="p-5 border-b border-gray-800 flex flex-col items-center gap-2">
        <Logo size="sm" variant="dark-frame" />
        <p className="text-[10px] text-amber-400/70 tracking-[0.3em] uppercase">Admin</p>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || location.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-all cursor-pointer text-sm",
                isActive
                  ? "bg-amber-500/20 text-amber-300 font-medium"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              )}>
                <Icon className={cn("w-4 h-4", isActive ? "text-amber-400" : "text-gray-500")} />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-800">
        {onLogout && (
          <Button
            variant="ghost" size="sm"
            className="w-full justify-start gap-2 text-gray-400 hover:text-white hover:bg-gray-800"
            onClick={onLogout}
          >
            <LogOut className="w-4 h-4" />
            Abmelden
          </Button>
        )}
      </div>
    </aside>
  );
}

export function AdminShell({ children, onLogout }: { children: ReactNode; onLogout?: () => void }) {
  return (
    <div className="h-[100dvh] w-full flex bg-background text-foreground overflow-hidden">
      <AdminSidebar onLogout={onLogout} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
