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
import { useAuth } from "@/hooks/useAuth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function RedirectToAdmin() {
  const [, navigate] = useLocation();
  navigate("/fragebogen");
  return null;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { loggedIn, loading } = useAuth();
  const [, navigate] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
        Wird geladen…
      </div>
    );
  }

  if (!loggedIn) {
    navigate("/login");
    return null;
  }

  return <>{children}</>;
}

function Router() {
  const { loggedIn, login, logout } = useAuth();

  return (
    <Switch>
      {/* Public — questionnaire for couples */}
      <Route path="/">{() => <Fragebogen />}</Route>

      {/* Admin login */}
      <Route path="/login">
        {() =>
          loggedIn ? (
            <RedirectToAdmin />
          ) : (
            <Login onLogin={login} />
          )
        }
      </Route>

      {/* Protected admin routes */}
      <Route path="/dashboard">
        <ProtectedRoute>
          <Shell onLogout={logout}>
            <Dashboard />
          </Shell>
        </ProtectedRoute>
      </Route>
      <Route path="/prospects/:id">
        {() => (
          <ProtectedRoute>
            <Shell onLogout={logout}>
              <ProspectDetail />
            </Shell>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/prospects">
        <ProtectedRoute>
          <Shell onLogout={logout}>
            <Prospects />
          </Shell>
        </ProtectedRoute>
      </Route>
      <Route path="/campaigns/:id">
        {() => (
          <ProtectedRoute>
            <Shell onLogout={logout}>
              <CampaignDetail />
            </Shell>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/campaigns">
        <ProtectedRoute>
          <Shell onLogout={logout}>
            <Campaigns />
          </Shell>
        </ProtectedRoute>
      </Route>
      <Route path="/compose">
        <ProtectedRoute>
          <Shell onLogout={logout}>
            <Compose />
          </Shell>
        </ProtectedRoute>
      </Route>
      <Route path="/emails">
        <ProtectedRoute>
          <Shell onLogout={logout}>
            <Emails />
          </Shell>
        </ProtectedRoute>
      </Route>
      <Route path="/fragebogen">
        <ProtectedRoute>
          <Shell onLogout={logout}>
            <FragebogenAdmin />
          </Shell>
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
