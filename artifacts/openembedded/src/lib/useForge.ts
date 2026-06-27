// @ts-nocheck
/**
 * useForge — manages the WebSocket connection to the Forge server and
 * bridges incoming events into graphStore + forgeStore.
 *
 * Must be called inside a component that has access to both stores.
 * Only connects when isDiscord && channelId are available.
 */
import { useEffect, useRef, useCallback } from "react";
import { useForgeStore } from "./forgeStore";
import { useGraphStore } from "./graphStore";
import { useDiscord } from "./discordContext";

function getForgeWsUrl(): string {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  return `${proto}//${host}/forge`;
}

export function useForge() {
  const wsRef = useRef<WebSocket | null>(null);
  const isRemoteChange = useRef(false);
  const prevNodesRef = useRef<any[]>([]);
  const prevEdgesRef = useRef<any[]>([]);
  const cursorThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { isDiscord, sdkState, user, channelId } = useDiscord();

  const {
    mode,
    setConnected,
    setChannelId,
    setMyUserId,
    addCrewMember,
    removeCrewMember,
    setCrewFull,
    setCursor,
    removeCursor,
    setClaim,
    releaseClaim,
    releaseAllClaimsBy,
  } = useForgeStore();

  const { setGraph, nodes, edges } = useGraphStore.getState
    ? { setGraph: useGraphStore.getState().setGraph, nodes: [], edges: [] }
    : { setGraph: () => {}, nodes: [], edges: [] };

  // ── Send helper ───────────────────────────────────────────────────────
  const send = useCallback((msg: object) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }, []);

  // ── Connect / Disconnect ──────────────────────────────────────────────
  useEffect(() => {
    if (!isDiscord || sdkState !== "ready" || !channelId || !user) return;
    if (mode === "solo") return;

    setChannelId(channelId);
    setMyUserId(user.id);

    const ws = new WebSocket(getForgeWsUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      ws.send(JSON.stringify({
        type: "join",
        channelId,
        userId: user.id,
        username: user.username,
        displayName: user.global_name ?? user.username,
        avatar: user.avatar,
      }));
    };

    ws.onclose = () => {
      setConnected(false);
      wsRef.current = null;
    };

    ws.onerror = (e) => {
      console.warn("[Forge] WebSocket error", e);
    };

    ws.onmessage = (ev) => {
      let msg: any;
      try { msg = JSON.parse(ev.data); } catch { return; }
      handleMessage(msg);
    };

    return () => {
      ws.close();
      setConnected(false);
      wsRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDiscord, sdkState, channelId, user?.id, mode]);

  // ── Handle incoming messages ──────────────────────────────────────────
  function handleMessage(msg: any) {
    const gs = useGraphStore.getState();
    const myId = user?.id;

    switch (msg.type) {
      case "forge:state": {
        isRemoteChange.current = true;
        gs.setGraph(msg.nodes ?? [], msg.edges ?? []);
        isRemoteChange.current = false;
        prevNodesRef.current = msg.nodes ?? [];
        prevEdgesRef.current = msg.edges ?? [];
        setCrewFull(msg.crew ?? []);
        // Apply initial claims
        const claims = msg.claims ?? {};
        for (const [nodeId, userId] of Object.entries(claims)) {
          // We don't know colors here — they'll come via crew members
          const crew = msg.crew ?? [];
          const member = crew.find((c: any) => c.userId === userId);
          if (member) setClaim(nodeId as string, { userId: userId as string, color: member.color });
        }
        break;
      }

      case "crew:join":
        addCrewMember(msg.user);
        break;

      case "crew:leave":
        removeCrewMember(msg.userId);
        removeCursor(msg.userId);
        releaseAllClaimsBy(msg.userId);
        break;

      case "cursor":
        if (msg.userId !== myId) setCursor(msg.userId, { x: msg.x, y: msg.y });
        break;

      case "node:add":
        if (msg.userId !== myId) {
          isRemoteChange.current = true;
          useGraphStore.getState().setGraph(
            [...useGraphStore.getState().nodes, msg.node],
            useGraphStore.getState().edges
          );
          isRemoteChange.current = false;
          prevNodesRef.current = useGraphStore.getState().nodes;
        }
        break;

      case "node:move":
        if (msg.userId !== myId) {
          isRemoteChange.current = true;
          const ns = useGraphStore.getState().nodes.map((n: any) =>
            n.id === msg.id ? { ...n, position: msg.position } : n
          );
          useGraphStore.getState().setGraph(ns, useGraphStore.getState().edges);
          isRemoteChange.current = false;
          prevNodesRef.current = ns;
        }
        break;

      case "node:update":
        if (msg.userId !== myId) {
          isRemoteChange.current = true;
          const ns = useGraphStore.getState().nodes.map((n: any) =>
            n.id === msg.id ? { ...n, data: { ...n.data, ...msg.data } } : n
          );
          useGraphStore.getState().setGraph(ns, useGraphStore.getState().edges);
          isRemoteChange.current = false;
          prevNodesRef.current = ns;
        }
        break;

      case "node:delete":
        if (msg.userId !== myId) {
          isRemoteChange.current = true;
          const ns = useGraphStore.getState().nodes.filter((n: any) => n.id !== msg.id);
          useGraphStore.getState().setGraph(ns, useGraphStore.getState().edges);
          isRemoteChange.current = false;
          prevNodesRef.current = ns;
        }
        break;

      case "edge:add":
        if (msg.userId !== myId) {
          isRemoteChange.current = true;
          const es = [...useGraphStore.getState().edges, msg.edge];
          useGraphStore.getState().setGraph(useGraphStore.getState().nodes, es);
          isRemoteChange.current = false;
          prevEdgesRef.current = es;
        }
        break;

      case "edge:delete":
        if (msg.userId !== myId) {
          isRemoteChange.current = true;
          const es = useGraphStore.getState().edges.filter((e: any) => e.id !== msg.id);
          useGraphStore.getState().setGraph(useGraphStore.getState().nodes, es);
          isRemoteChange.current = false;
          prevEdgesRef.current = es;
        }
        break;

      case "claim:take":
        setClaim(msg.nodeId, { userId: msg.userId, color: msg.color });
        break;

      case "claim:release":
        releaseClaim(msg.nodeId);
        break;
    }
  }

  // ── Subscribe to local graph changes → broadcast ──────────────────────
  useEffect(() => {
    if (mode === "solo") return;

    const unsub = useGraphStore.subscribe((state: any, prev: any) => {
      if (isRemoteChange.current) return;
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;

      const newNodes = state.nodes.filter(
        (n: any) => !prevNodesRef.current.some((p: any) => p.id === n.id)
      );
      const removedNodes = prevNodesRef.current.filter(
        (p: any) => !state.nodes.some((n: any) => n.id === p.id)
      );
      const newEdges = state.edges.filter(
        (e: any) => !prevEdgesRef.current.some((p: any) => p.id === e.id)
      );
      const removedEdges = prevEdgesRef.current.filter(
        (p: any) => !state.edges.some((e: any) => e.id === p.id)
      );

      // Detect data changes on existing nodes
      state.nodes.forEach((n: any) => {
        const prev = prevNodesRef.current.find((p: any) => p.id === n.id);
        if (prev && JSON.stringify(prev.data) !== JSON.stringify(n.data)) {
          send({ type: "node:update", id: n.id, data: n.data });
        }
      });

      newNodes.forEach((n: any) => send({ type: "node:add", node: n }));
      removedNodes.forEach((n: any) => send({ type: "node:delete", id: n.id }));
      newEdges.forEach((e: any) => send({ type: "edge:add", edge: e }));
      removedEdges.forEach((e: any) => send({ type: "edge:delete", id: e.id }));

      prevNodesRef.current = state.nodes;
      prevEdgesRef.current = state.edges;
    });

    return unsub;
  }, [mode, send]);

  // ── Cursor tracking ───────────────────────────────────────────────────
  const sendCursor = useCallback((x: number, y: number) => {
    if (mode === "solo") return;
    if (cursorThrottleRef.current) return;
    cursorThrottleRef.current = setTimeout(() => {
      cursorThrottleRef.current = null;
    }, 50);
    send({ type: "cursor", x, y });
  }, [mode, send]);

  // ── Node drag stop → send position ────────────────────────────────────
  const sendNodeMove = useCallback((id: string, position: { x: number; y: number }) => {
    if (mode === "solo") return;
    send({ type: "node:move", id, position });
  }, [mode, send]);

  // ── Claim controls ────────────────────────────────────────────────────
  const takeClaim = useCallback((nodeId: string, override = false) => {
    if (mode === "solo") return;
    send({ type: "claim:take", nodeId, override });
  }, [mode, send]);

  const dropClaim = useCallback((nodeId: string) => {
    if (mode === "solo") return;
    send({ type: "claim:release", nodeId });
  }, [mode, send]);

  return { send, sendCursor, sendNodeMove, takeClaim, dropClaim };
}
