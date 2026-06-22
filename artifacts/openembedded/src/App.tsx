import { Switch, Route, Router as WouterRouter } from "wouter";
import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Home } from "@/pages/Home";
import NotFound from "@/pages/not-found";
import { DiscordProvider } from "@/lib/discordContext";
import { DiscordActivityOverlay } from "@/components/DiscordActivityOverlay";
import { SpeedInsights } from "@vercel/speed-insights/react";

const Builder = lazy(() => import("@/pages/Builder").then((m) => ({ default: m.Builder })));
const Docs = lazy(() => import("@/pages/Docs").then((m) => ({ default: m.Docs })));

const queryClient = new QueryClient();

function Support() {
  window.location.replace("https://discord.gg/P84XzN2UKh");
  return null;
}

function PageLoader() {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#0f0f0f", minHeight: "100vh" }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 0.8s linear infinite" }}>
        <circle cx="12" cy="12" r="10" stroke="rgba(88,101,242,0.18)" strokeWidth="2.5" />
        <path d="M12 2A10 10 0 0 1 22 12" stroke="#5865F2" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <style>{`@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/docs">
        <Suspense fallback={<PageLoader />}>
          <Docs />
        </Suspense>
      </Route>
      <Route path="/support" component={Support} />
      <Route path="/builder/:id">
        <Suspense fallback={<PageLoader />}>
          <Builder />
        </Suspense>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <DiscordProvider>
          <DiscordActivityOverlay />
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
          <SpeedInsights />
        </DiscordProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
