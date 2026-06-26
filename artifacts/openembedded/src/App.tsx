import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Home } from "@/pages/Home";
import NotFound from "@/pages/not-found";
import { Login } from "@/pages/Login";
import { Landing } from "@/pages/Landing";
import { AuthCallback } from "@/pages/AuthCallback";
import { AuthProvider, useAuth } from "@/lib/authContext";
import { DiscordProvider, useDiscord } from "@/lib/discordContext";
import { DiscordActivityOverlay } from "@/components/DiscordActivityOverlay";

const Builder = lazy(() => import("@/pages/Builder").then((m) => ({ default: m.Builder })));
const Docs    = lazy(() => import("@/pages/Docs").then((m) => ({ default: m.Docs })));
const Terms   = lazy(() => import("@/pages/Terms").then((m) => ({ default: m.Terms })));
const Privacy = lazy(() => import("@/pages/Privacy").then((m) => ({ default: m.Privacy })));

const queryClient = new QueryClient();

function Support() {
  window.location.replace("https://discord.gg/P84XzN2UKh");
  return null;
}

function PageLoader() {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#111111",
        minHeight: "100vh",
      }}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        style={{ animation: "spin 0.8s linear infinite" }}
      >
        <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
        <path
          d="M12 2A10 10 0 0 1 22 12"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      <style>{`@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>
    </div>
  );
}

/* ── AuthGuard ───────────────────────────────────────────────────────────────
 *  Protects routes from unauthenticated access.
 *  Discord Activity users are handled by DiscordActivityOverlay — they bypass
 *  this guard while the overlay is visible so the two systems don't conflict.
 * ─────────────────────────────────────────────────────────────────────────── */
function AuthGuard({ children }: { children: ReactNode }) {
  const { auth } = useAuth();
  const { isDiscord } = useDiscord();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (auth.status === "unauthenticated" && !isDiscord) {
      navigate("/login");
    }
  }, [auth.status, isDiscord, navigate]);

  // Discord Activity: auth is managed by DiscordActivityOverlay
  if (isDiscord) return <>{children}</>;

  // Web browser: show loader while checking session
  if (auth.status === "loading") return <PageLoader />;

  // Unauthenticated: render nothing while navigate fires
  if (auth.status === "unauthenticated") return null;

  return <>{children}</>;
}

/* ── RootRoute ───────────────────────────────────────────────────────────────
 *  Shows Landing page for unauthenticated visitors.
 *  Authenticated users see their project dashboard (Home).
 * ─────────────────────────────────────────────────────────────────────────── */
function RootRoute() {
  const { auth } = useAuth();
  const { isDiscord } = useDiscord();

  // Discord Activity bypasses landing
  if (isDiscord) return <Home />;

  // Still checking session — show nothing (avoids flash)
  if (auth.status === "loading") return <PageLoader />;

  // Unauthenticated visitors → public landing page
  if (auth.status === "unauthenticated") return <Landing />;

  // Authenticated → dashboard
  return <Home />;
}

function Router() {
  return (
    <Switch>
      {/* ── Public routes — no auth required ────────────────────────── */}
      <Route path="/login" component={Login} />
      <Route path="/auth/callback" component={AuthCallback} />
      <Route path="/docs">
        <Suspense fallback={<PageLoader />}>
          <Docs />
        </Suspense>
      </Route>
      <Route path="/tos">
        <Suspense fallback={<PageLoader />}>
          <Terms />
        </Suspense>
      </Route>
      <Route path="/privacy">
        <Suspense fallback={<PageLoader />}>
          <Privacy />
        </Suspense>
      </Route>
      <Route path="/support" component={Support} />

      {/* ── Root — Landing (unauth) or Dashboard (auth) ─────────────── */}
      <Route path="/" component={RootRoute} />
      <Route path="/builder/:id">
        <AuthGuard>
          <Suspense fallback={<PageLoader />}>
            <Builder />
          </Suspense>
        </AuthGuard>
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
          <AuthProvider>
            <DiscordActivityOverlay />
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </AuthProvider>
        </DiscordProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
