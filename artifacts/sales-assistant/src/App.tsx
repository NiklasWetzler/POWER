import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Shell } from "@/components/layout/Shell";
import Dashboard from "@/pages/Dashboard";
import Campaigns from "@/pages/Campaigns";
import CampaignDetail from "@/pages/CampaignDetail";
import Prospects from "@/pages/Prospects";
import ProspectDetail from "@/pages/ProspectDetail";
import Emails from "@/pages/Emails";
import Compose from "@/pages/Compose";
import Fragebogen from "@/pages/Fragebogen";
import FragebogenAdmin from "@/pages/FragebogenAdmin";
import Login from "@/pages/Login";
import { AuthContext, useAuth, useAuthProvider } from "@/hooks/useAuth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { loggedIn, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !loggedIn) {
      navigate("/login");
    }
  }, [loggedIn, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
        Wird geladen…
      </div>
    );
  }

  if (!loggedIn) return null;

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  return (
    <ProtectedRoute>
      <Shell onLogout={logout}>{children}</Shell>
    </ProtectedRoute>
  );
}

function LoginRoute() {
  const { loggedIn, loading, login } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && loggedIn) navigate("/fragebogen");
  }, [loggedIn, loading, navigate]);

  if (loading || loggedIn) return null;
  return <Login onLogin={login} />;
}

function Router() {
  return (
    <Switch>
      {/* Public — questionnaire for couples */}
      <Route path="/">{() => <Fragebogen />}</Route>

      {/* Admin login */}
      <Route path="/login">{() => <LoginRoute />}</Route>

      {/* Protected admin routes */}
      <Route path="/dashboard">
        <AdminRoute><Dashboard /></AdminRoute>
      </Route>
      <Route path="/prospects/:id">
        {() => <AdminRoute><ProspectDetail /></AdminRoute>}
      </Route>
      <Route path="/prospects">
        <AdminRoute><Prospects /></AdminRoute>
      </Route>
      <Route path="/campaigns/:id">
        {() => <AdminRoute><CampaignDetail /></AdminRoute>}
      </Route>
      <Route path="/campaigns">
        <AdminRoute><Campaigns /></AdminRoute>
      </Route>
      <Route path="/compose">
        <AdminRoute><Compose /></AdminRoute>
      </Route>
      <Route path="/emails">
        <AdminRoute><Emails /></AdminRoute>
      </Route>
      <Route path="/fragebogen">
        <AdminRoute><FragebogenAdmin /></AdminRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const auth = useAuthProvider();
  return (
    <AuthContext.Provider value={auth}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </AuthContext.Provider>
  );
}

export default App;
