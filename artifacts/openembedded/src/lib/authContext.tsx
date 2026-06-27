/**
 * Web-browser authentication context.
 *
 * Manages session state for standard-browser users via Discord OAuth2.
 * Discord Activity (embedded SDK) users are handled separately by
 * discordContext.tsx — this provider co-exists without conflict.
 *
 * Security model:
 *   - CSRF: state nonce generated with crypto.getRandomValues, stored in
 *     sessionStorage (tab-scoped, cleared on tab close), single-use.
 *   - Code exchange: fully server-side via POST /api/v1/auth/login.
 *     The Discord client_secret and access_token never reach the browser.
 *   - Session: httpOnly cookie, SameSite=Lax, Secure in production.
 *     Session ID regenerated server-side after auth (CWE-384 prevention).
 */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useLocation } from "wouter";

// ── Types ──────────────────────────────────────────────────────────────────

export type AuthUser = {
  id: string;
  username: string;
  globalName: string | null;
  discriminator: string;
  avatar: string | null;
};

type AuthState =
  | { status: "loading" }
  | { status: "authenticated"; user: AuthUser }
  | { status: "unauthenticated" };

interface AuthContextValue {
  auth: AuthState;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => Promise<void>;
  completeAuth: (code: string, state: string, redirectUri: string) => Promise<void>;
  refreshAuth: () => Promise<void>;
}

// ── Context ────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue>({
  auth: { status: "loading" },
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: async () => {},
  completeAuth: async () => {},
  refreshAuth: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// ── Crypto helpers ─────────────────────────────────────────────────────────

/** Generate a cryptographically random base64url-encoded state nonce. */
function generateState(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

const OAUTH_STATE_KEY = "oe_oauth_state";
const OAUTH_RETURN_KEY = "oe_oauth_return";

// ── Cookie helpers ─────────────────────────────────────────────────────────
// sessionStorage is tab-scoped and gets wiped on mobile redirects/new tabs.
// We use a short-lived cookie for the CSRF state so it survives the
// Discord OAuth round-trip regardless of how the browser handles the redirect.

function setStateCookie(value: string): void {
  const isSecure = window.location.protocol === "https:";
  const maxAge = 300; // 5 minutes — plenty for OAuth flow
  document.cookie = [
    `${OAUTH_STATE_KEY}=${encodeURIComponent(value)}`,
    `max-age=${maxAge}`,
    "path=/",
    "SameSite=Lax",
    ...(isSecure ? ["Secure"] : []),
  ].join("; ");
}

function getStateCookie(): string | null {
  const prefix = `${OAUTH_STATE_KEY}=`;
  const match = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(prefix));
  return match ? decodeURIComponent(match.slice(prefix.length)) : null;
}

function clearStateCookie(): void {
  document.cookie = `${OAUTH_STATE_KEY}=; max-age=0; path=/; SameSite=Lax`;
}

// ── Provider ───────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });
  const [, navigate] = useLocation();

  const fetchSession = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch("/api/v1/auth/session");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { authenticated: boolean; user: AuthUser | null };
      if (data.authenticated && data.user) {
        setAuth({ status: "authenticated", user: data.user });
      } else {
        setAuth({ status: "unauthenticated" });
      }
    } catch {
      setAuth({ status: "unauthenticated" });
    }
  }, []);

  // Check existing session on mount (restores auth after page refresh)
  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  /** Initiate Discord OAuth2 flow. Generates CSRF state and redirects. */
  const login = useCallback(() => {
    fetch("/api/v1/discord/config")
      .then((r) => r.json())
      .then((config: { clientId: string; configured: boolean }) => {
        if (!config.configured || !config.clientId) {
          throw new Error("sign-in-unavailable");
        }

        const state = generateState();
        const redirectUri = `${window.location.origin}/auth/callback`;

        // Store CSRF state in a cookie — survives mobile redirects & new tabs
        // (sessionStorage is tab-scoped and gets wiped on OAuth round-trips)
        setStateCookie(state);
        // Remember where to return after login (sessionStorage is fine here —
        // it's non-security-critical and falls back to "/" if missing)
        const returnTo = window.location.pathname;
        sessionStorage.setItem(OAUTH_RETURN_KEY, returnTo === "/login" ? "/" : returnTo);

        const params = new URLSearchParams({
          client_id: config.clientId,
          redirect_uri: redirectUri,
          response_type: "code",
          scope: "identify",
          state,
        });

        window.location.href = `https://discord.com/api/oauth2/authorize?${params}`;
      })
      .catch((err: unknown) => {
        console.error("[Auth] login initiation failed:", err);
        // Redirect to login page — it shows proper inline error UI for
        // misconfiguration without leaking any internal details to the user.
        navigate("/login");
      });
  }, []);

  /** Complete the OAuth2 callback: validate CSRF state, exchange code for session. */
  const completeAuth = useCallback(
    async (code: string, state: string, redirectUri: string): Promise<void> => {
      // Validate CSRF state — read from cookie (set before OAuth redirect)
      const storedState = getStateCookie();
      clearStateCookie(); // single-use: clear immediately regardless of outcome
      if (!storedState || storedState !== state) {
        throw new Error(
          "Sign-in session expired or was opened in a different tab. Please try signing in again."
        );
      }

      const returnPath = sessionStorage.getItem(OAUTH_RETURN_KEY) ?? "/";
      sessionStorage.removeItem(OAUTH_RETURN_KEY);

      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, redirectUri }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` })) as { error?: string };
        throw new Error(err.error ?? "Authentication failed. Please try again.");
      }

      const user = (await res.json()) as AuthUser;
      setAuth({ status: "authenticated", user });
      navigate(returnPath);
    },
    [navigate]
  );

  /** Re-fetch session state — called by Discord Activity overlay after syncUser. */
  const refreshAuth = useCallback(async (): Promise<void> => {
    await fetchSession();
  }, [fetchSession]);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
    } catch {
      // Best effort — clear local state regardless
    }
    setAuth({ status: "unauthenticated" });
    navigate("/login");
  }, [navigate]);

  const user = auth.status === "authenticated" ? auth.user : null;

  return (
    <AuthContext.Provider
      value={{
        auth,
        user,
        isAuthenticated: auth.status === "authenticated",
        isLoading: auth.status === "loading",
        login,
        logout,
        completeAuth,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
