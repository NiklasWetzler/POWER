import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Send,
  Target,
  PenSquare,
  ClipboardList,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function Sidebar({ onLogout }: { onLogout?: () => void }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/prospects", label: "Prospects", icon: Users },
    { href: "/campaigns", label: "Campaigns", icon: Target },
    { href: "/emails", label: "Emails", icon: Send },
    { href: "/compose", label: "Compose Draft", icon: PenSquare },
  ];

  const extraItems = [
    { href: "/fragebogen", label: "Online Fragebogen", icon: ClipboardList },
  ];

  return (
    <aside className="w-64 border-r border-border bg-sidebar h-full flex flex-col flex-shrink-0">
      <div className="p-6 border-b border-sidebar-border h-16 flex items-center">
        <div className="flex items-center gap-2 text-sidebar-primary">
          <div className="w-8 h-8 rounded bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-bold">
            S
          </div>
          <span className="font-bold text-lg text-sidebar-foreground tracking-tight">SalesCockpit</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || location.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-all group cursor-pointer",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
                data-testid={`nav-link-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-sidebar-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/70")} />
                {item.label}
              </div>
            </Link>
          );
        })}

        <div className="pt-3 mt-3 border-t border-sidebar-border/50">
          {extraItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md transition-all group cursor-pointer",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                  data-testid={`nav-link-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <Icon className={cn("w-4 h-4", isActive ? "text-sidebar-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/70")} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-2">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-medium border border-sidebar-border">
            NW
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-sidebar-foreground">NIWEWorker</span>
            <span className="text-xs text-sidebar-foreground/50">Admin</span>
          </div>
        </div>
        {onLogout && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
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
