import { Switch, Route, Router as WouterRouter } from "wouter";
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <Switch>
      {/* Public customer-facing route — no Shell, no sidebar */}
      <Route path="/">{() => <Fragebogen />}</Route>

      {/* Internal admin routes — wrapped in Shell with sidebar */}
      <Route path="/dashboard">
        <Shell>
          <Dashboard />
        </Shell>
      </Route>
      <Route path="/prospects/:id">
        {(params) => (
          <Shell>
            <ProspectDetail />
          </Shell>
        )}
      </Route>
      <Route path="/prospects">
        <Shell>
          <Prospects />
        </Shell>
      </Route>
      <Route path="/campaigns/:id">
        {() => (
          <Shell>
            <CampaignDetail />
          </Shell>
        )}
      </Route>
      <Route path="/campaigns">
        <Shell>
          <Campaigns />
        </Shell>
      </Route>
      <Route path="/compose">
        <Shell>
          <Compose />
        </Shell>
      </Route>
      <Route path="/emails">
        <Shell>
          <Emails />
        </Shell>
      </Route>
      <Route path="/fragebogen">
        <Shell>
          <FragebogenAdmin />
        </Shell>
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
