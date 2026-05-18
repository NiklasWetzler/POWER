import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export function Shell({ children, onLogout }: { children: ReactNode; onLogout?: () => void }) {
  return (
    <div className="h-[100dvh] w-full flex bg-background text-foreground overflow-hidden selection:bg-primary/30">
      <Sidebar onLogout={onLogout} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center px-4 md:px-8 shrink-0 sticky top-0 z-10 md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden mr-2">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 bg-sidebar border-r-sidebar-border">
              <Sidebar onLogout={onLogout} />
            </SheetContent>
          </Sheet>
          <div className="font-bold text-lg tracking-tight">SalesCockpit</div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto h-full flex flex-col">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
