import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Home } from "@/pages/Home";
import { Builder } from "@/pages/Builder";
import NotFound from "@/pages/not-found";
import { DiscordProvider } from "@/lib/discordContext";
import { DiscordActivityOverlay } from "@/components/DiscordActivityOverlay";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/builder/:id" component={Builder} />
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
        </DiscordProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
