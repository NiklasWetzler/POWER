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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

const navItems = [
  { href: "/admin/fragebogen", label: "Fragebögen", icon: ClipboardList },
  { href: "/admin/kunden", label: "Kunden", icon: Users },
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
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

  return (
    <aside
      className={cn(
        "relative border-r border-border bg-gray-900 h-full flex flex-col flex-shrink-0 transition-[width] duration-200",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Collapse toggle */}
      <button
        type="button"
        onClick={onToggle}
        aria-label={collapsed ? "Menü ausklappen" : "Menü einklappen"}
        className="absolute -right-3 top-7 z-20 w-6 h-6 rounded-full bg-gray-800 border border-gray-700 text-gray-300 hover:bg-amber-500 hover:text-white hover:border-amber-500 flex items-center justify-center shadow-md transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5" />
        )}
      </button>

      <div
        className={cn(
          "border-b border-gray-800 flex flex-col items-center gap-2",
          collapsed ? "p-3" : "p-5"
        )}
      >
        {collapsed ? (
          <Logo size="xs" variant="light" />
        ) : (
          <>
            <Logo size="sm" variant="light" />
            <p className="text-[10px] text-amber-400/70 tracking-[0.3em] uppercase">
              Admin
            </p>
          </>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location === item.href || location.startsWith(item.href + "/");
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
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0",
                    isActive ? "text-amber-400" : "text-gray-500"
                  )}
                />
                {!collapsed && <span>{item.label}</span>}
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
        window.localStorage.setItem(
          "niwe.admin.sidebarCollapsed",
          next ? "1" : "0"
        );
      } catch {
        // ignore storage errors (private mode etc.)
      }
      return next;
    });
  };

  return (
    <div className="h-[100dvh] w-full flex bg-background text-foreground overflow-hidden">
      <AdminSidebar
        onLogout={onLogout}
        collapsed={collapsed}
        onToggle={toggle}
      />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
