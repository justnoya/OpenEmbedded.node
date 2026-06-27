// @ts-nocheck
/**
 * useRichPresence — drives Discord Rich Presence updates from Builder state.
 *
 * Batches updates with a 3-second debounce so rapid node changes don't spam
 * Discord's RPC API. Works silently when not in a Discord context.
 */
import { useEffect, useRef, useCallback } from "react";
import { useDiscord } from "./discordContext.js";

export type PresenceAction =
  | "designing"
  | "previewing"
  | "exporting"
  | "idle";

interface UseRichPresenceOptions {
  projectName: string;
  nodeCount: number;
  edgeCount: number;
  action?: PresenceAction;
  startTimestamp?: number;
}

const ACTION_LABELS: Record<PresenceAction, string> = {
  designing: "Designing embed",
  previewing: "Previewing",
  exporting: "Exporting to Discord",
  idle: "In the builder",
};

const ACTION_ICONS: Record<PresenceAction, string> = {
  designing: "designing",
  previewing: "previewing",
  exporting: "exporting",
  idle: "idle",
};

export function useRichPresence({
  projectName,
  nodeCount,
  edgeCount,
  action = "designing",
  startTimestamp,
}: UseRichPresenceOptions) {
  const { isDiscord, sdkState, setActivity } = useDiscord();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const sessionStart = useRef<number>(Date.now());

  const push = useCallback(() => {
    if (!isDiscord || sdkState !== "ready") return;

    const nodeLabel =
      nodeCount === 0
        ? "Empty canvas"
        : `${nodeCount} node${nodeCount !== 1 ? "s" : ""}${
            edgeCount > 0
              ? ` · ${edgeCount} connection${edgeCount !== 1 ? "s" : ""}`
              : ""
          }`;

    setActivity({
      details: ACTION_LABELS[action],
      state: `${projectName} — ${nodeLabel}`,
      startTimestamp: startTimestamp ?? sessionStart.current,
      largeImageKey: "openembedded_logo",
      largeImageText: "OpenEmbedded — Discord embed builder",
      smallImageKey: ACTION_ICONS[action],
      smallImageText: ACTION_LABELS[action],
    });
  }, [isDiscord, sdkState, projectName, nodeCount, edgeCount, action, startTimestamp, setActivity]);

  useEffect(() => {
    if (!isDiscord || sdkState !== "ready") return;
    clearTimeout(timer.current);
    timer.current = setTimeout(push, 3000);
    return () => clearTimeout(timer.current);
  }, [isDiscord, sdkState, push]);

  // Push immediately when SDK first becomes ready
  useEffect(() => {
    if (sdkState === "ready") push();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sdkState]);
}
