import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// Auth contexts
import { AuthContext, useAuth, useAuthProvider } from "@/hooks/useAuth";
import { CustomerAuthContext, useCustomerAuth, useCustomerAuthProvider } from "@/hooks/useCustomerAuth";

// Layouts
import { AdminShell } from "@/components/layout/AdminShell";
import { CustomerShell } from "@/components/layout/CustomerShell";

// Public pages
import Landing from "@/pages/Landing";
import Fragebogen from "@/pages/Fragebogen";
import AdminLogin from "@/pages/AdminLogin";
import Impressum from "@/pages/Impressum";
import Datenschutz from "@/pages/Datenschutz";

// Customer portal pages
import PortalHome from "@/pages/portal/PortalHome";
import Formulare from "@/pages/portal/Formulare";
import UebermittelteFormulare from "@/pages/portal/UebermittelteFormulare";
import MusikFragebogenPortal from "@/pages/portal/MusikFragebogenPortal";

// Admin pages
import FragebogenAdmin from "@/pages/FragebogenAdmin";
import Kunden from "@/pages/admin/Kunden";
import Dashboard from "@/pages/Dashboard";

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
});

// ── Customer auth guard ──────────────────────────────────────
function CustomerRoute({ children }: { children: React.ReactNode }) {
  const { loggedIn, loading, logout } = useCustomerAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !loggedIn) navigate("/");
  }, [loggedIn, loading, navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Wird geladen…</div>;
  if (!loggedIn) return null;

  return <CustomerShell onLogout={logout}>{children}</CustomerShell>;
}

// ── Admin auth guard ─────────────────────────────────────────
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { loggedIn, loading, logout } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !loggedIn) navigate("/admin");
  }, [loggedIn, loading, navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Wird geladen…</div>;
  if (!loggedIn) return null;

  return <AdminShell onLogout={logout}>{children}</AdminShell>;
}

// ── Landing redirect if already logged in ────────────────────
function LandingRoute() {
  const { loggedIn: customerLoggedIn, loading: cLoading, login } = useCustomerAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!cLoading && customerLoggedIn) navigate("/portal");
  }, [customerLoggedIn, cLoading, navigate]);

  if (cLoading || customerLoggedIn) return null;
  return <Landing onLogin={login} />;
}

// ── Admin login redirect if already logged in ────────────────
function AdminLoginRoute() {
  const { loggedIn, loading, login } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && loggedIn) navigate("/admin/fragebogen");
  }, [loggedIn, loading, navigate]);

  if (loading || loggedIn) return null;
  return <AdminLogin onLogin={login} />;
}

// ── Router ───────────────────────────────────────────────────
function Router() {
  return (
    <Switch>
      {/* Public — NIWE WEDDINGS APP landing + customer login */}
      <Route path="/">{() => <LandingRoute />}</Route>

      {/* Legal */}
      <Route path="/impressum">{() => <Impressum />}</Route>
      <Route path="/datenschutz">{() => <Datenschutz />}</Route>

      {/* Legacy public questionnaire link (send-link emails go here) */}
      <Route path="/fragebogen-oeffentlich">{() => <Fragebogen />}</Route>

      {/* Customer portal */}
      <Route path="/portal/formulare/musikfragebogen">
        {() => <CustomerRoute><MusikFragebogenPortal /></CustomerRoute>}
      </Route>
      <Route path="/portal/formulare">
        {() => <CustomerRoute><Formulare /></CustomerRoute>}
      </Route>
      <Route path="/portal/eingereicht">
        {() => <CustomerRoute><UebermittelteFormulare /></CustomerRoute>}
      </Route>
      <Route path="/portal">
        {() => <CustomerRoute><PortalHome /></CustomerRoute>}
      </Route>

      {/* Admin login */}
      <Route path="/admin">{() => <AdminLoginRoute />}</Route>

      {/* Admin area */}
      <Route path="/admin/fragebogen">
        {() => <AdminRoute><FragebogenAdmin /></AdminRoute>}
      </Route>
      <Route path="/admin/kunden">
        {() => <AdminRoute><Kunden /></AdminRoute>}
      </Route>
      <Route path="/admin/dashboard">
        {() => <AdminRoute><Dashboard /></AdminRoute>}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

// ── App root ─────────────────────────────────────────────────
function AppInner() {
  const adminAuth = useAuthProvider();
  const customerAuth = useCustomerAuthProvider();

  return (
    <AuthContext.Provider value={adminAuth}>
      <CustomerAuthContext.Provider value={customerAuth}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </CustomerAuthContext.Provider>
    </AuthContext.Provider>
  );
}

export default AppInner;
