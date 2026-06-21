/**
 * Discord Activity SDK context.
 *
 * Detects whether the app is running inside Discord (as an embedded Activity
 * or via its in-app browser) and, if so, boots the Embedded App SDK, runs
 * the OAuth handshake, and exposes helpers for Rich Presence updates.
 *
 * The app works identically in a normal browser — SDK is simply absent.
 */
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { DiscordSDK, DiscordSDKMock, type Types } from "@discord/embedded-app-sdk";

// ── Types ──────────────────────────────────────────────────────────────────

export type DiscordUser = {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  global_name?: string | null;
};

export type SDKState =
  | "idle"       // not in Discord
  | "loading"    // SDK initialising
  | "auth"       // OAuth handshake in progress
  | "ready"      // fully authenticated
  | "error";     // something went wrong

export type ActivityPresence = {
  state?: string;
  details?: string;
  startTimestamp?: number;
  largeImageKey?: string;
  largeImageText?: string;
  smallImageKey?: string;
  smallImageText?: string;
  partyId?: string;
  partySize?: [current: number, max: number];
};

interface DiscordContextValue {
  isDiscord: boolean;
  sdkState: SDKState;
  errorMsg: string | null;
  user: DiscordUser | null;
  guildId: string | null;
  channelId: string | null;
  instanceId: string | null;
  /** The OAuth access token — available once sdkState === "ready". */
  accessToken: string | null;
  /** Explicitly sync the authenticated user to the backend. Called by the sign-in overlay on Continue. */
  syncUser: (token: string) => Promise<void>;
  setActivity: (presence: ActivityPresence) => Promise<void>;
  clearActivity: () => Promise<void>;
}

// ── Context ────────────────────────────────────────────────────────────────

const DiscordContext = createContext<DiscordContextValue>({
  isDiscord: false,
  sdkState: "idle",
  errorMsg: null,
  user: null,
  guildId: null,
  channelId: null,
  instanceId: null,
  accessToken: null,
  syncUser: async () => {},
  setActivity: async () => {},
  clearActivity: async () => {},
});

export const useDiscord = () => useContext(DiscordContext);

// ── Helpers ────────────────────────────────────────────────────────────────

function isInsideDiscord(): boolean {
  const params = new URLSearchParams(window.location.search);
  if (params.has("frame_id")) return true;
  if (import.meta.env.VITE_FORCE_DISCORD_ACTIVITY === "true") return true;
  return false;
}

// ── Provider ───────────────────────────────────────────────────────────────

export function DiscordProvider({ children }: { children: ReactNode }) {
  const [sdkState, setSdkState] = useState<SDKState>(
    isInsideDiscord() ? "loading" : "idle"
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [user, setUser] = useState<DiscordUser | null>(null);
  const [guildId, setGuildId] = useState<string | null>(null);
  const [channelId, setChannelId] = useState<string | null>(null);
  const [instanceId, setInstanceId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const sdkRef = useRef<DiscordSDK | DiscordSDKMock | null>(null);
  const isDiscord = sdkState !== "idle";

  useEffect(() => {
    if (!isInsideDiscord()) return;

    let cancelled = false;

    async function boot() {
      try {
        // 1. Fetch public client ID from backend
        const configRes = await fetch("/api/v1/discord/config");
        const config = (await configRes.json()) as {
          clientId: string;
          configured: boolean;
        };

        let sdk: DiscordSDK | DiscordSDKMock;

        if (!config.configured || !config.clientId) {
          console.warn("[Discord] No client ID configured, using mock SDK");
          sdk = new DiscordSDKMock("", null, null, null);
        } else {
          sdk = new DiscordSDK(config.clientId);
        }

        sdkRef.current = sdk;
        await sdk.ready();
        if (cancelled) return;

        setInstanceId((sdk as DiscordSDK).instanceId ?? null);
        setGuildId((sdk as DiscordSDK).guildId ?? null);
        setChannelId((sdk as DiscordSDK).channelId ?? null);

        // 2. OAuth authorize
        setSdkState("auth");
        const { code } = await sdk.commands.authorize({
          client_id: config.clientId || "",
          response_type: "code",
          state: "",
          prompt: "none",
          scope: ["identify", "rpc.activities.write"] as Types.OAuthScopes[],
        });

        if (cancelled) return;

        // 3. Exchange code for token server-side
        const tokenRes = await fetch("/api/v1/discord/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        if (!tokenRes.ok) {
          const errBody = await tokenRes.json().catch(() => ({ error: `HTTP ${tokenRes.status}` })) as { error?: string };
          throw new Error(errBody.error ?? `Token exchange failed (HTTP ${tokenRes.status})`);
        }

        const { access_token } = (await tokenRes.json()) as {
          access_token: string;
        };

        // 4. Authenticate SDK
        const authed = await sdk.commands.authenticate({ access_token });
        if (cancelled) return;

        setUser(authed.user as DiscordUser);
        setAccessToken(access_token);
        setSdkState("ready");
        // Backend sync is deferred — the sign-in overlay calls syncUser() on Continue.
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("[Discord SDK] Init error:", msg);
          setErrorMsg(msg);
          setSdkState("error");
        }
      }
    }

    boot();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── syncUser — called explicitly by the sign-in overlay ────────────────

  const syncUser = useCallback(async (token: string) => {
    try {
      await fetch("/api/v1/discord/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: token }),
      });
    } catch (e) {
      console.warn("[Discord] Failed to sync user account:", e);
    }
  }, []);

  // ── Rich Presence ──────────────────────────────────────────────────────

  const setActivity = useCallback(async (presence: ActivityPresence) => {
    const sdk = sdkRef.current as DiscordSDK | null;
    if (!sdk) return;
    try {
      await (sdk as DiscordSDK).commands.setActivity({
        activity: {
          type: 0,
          state: presence.state,
          details: presence.details,
          timestamps: presence.startTimestamp
            ? { start: presence.startTimestamp }
            : undefined,
          assets: {
            large_image: presence.largeImageKey ?? "openembedded_logo",
            large_text: presence.largeImageText ?? "OpenEmbedded",
            small_image: presence.smallImageKey,
            small_text: presence.smallImageText,
          },
          party: presence.partyId
            ? {
                id: presence.partyId,
                size: presence.partySize as [number, number] | undefined,
              }
            : undefined,
        },
      });
    } catch (err) {
      console.warn("[Discord] setActivity failed:", err);
    }
  }, []);

  const clearActivity = useCallback(async () => {
    const sdk = sdkRef.current as DiscordSDK | null;
    if (!sdk) return;
    try {
      await (sdk as DiscordSDK).commands.setActivity({ activity: {} });
    } catch {
      // ignore
    }
  }, []);

  return (
    <DiscordContext.Provider
      value={{
        isDiscord,
        sdkState,
        errorMsg,
        user,
        guildId,
        channelId,
        instanceId,
        accessToken,
        syncUser,
        setActivity,
        clearActivity,
      }}
    >
      {children}
    </DiscordContext.Provider>
  );
}
