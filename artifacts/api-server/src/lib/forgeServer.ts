// @ts-nocheck
import { WebSocketServer, WebSocket } from "ws";
import type { Server as HttpServer } from "http";
import { logger } from "./logger";

// ── Types ──────────────────────────────────────────────────────────────────

type CrewMember = {
  ws: WebSocket;
  userId: string;
  username: string;
  displayName: string;
  avatar: string | null;
  color: string;
  channelId: string;
};

type RoomState = {
  clients: Set<CrewMember>;
  nodes: object[];
  edges: object[];
  claims: Map<string, string>; // nodeId → userId
};

// ── Color assignment ───────────────────────────────────────────────────────

const CREW_COLORS = [
  "#f59e0b", // amber
  "#3b82f6", // blue
  "#10b981", // emerald
  "#8b5cf6", // violet
  "#ef4444", // red
  "#06b6d4", // cyan
  "#f97316", // orange
  "#ec4899", // pink
];

function getUserColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) & 0x7fffffff;
  }
  return CREW_COLORS[hash % CREW_COLORS.length];
}

// ── Room registry ──────────────────────────────────────────────────────────

const rooms = new Map<string, RoomState>();

function getOrCreateRoom(channelId: string): RoomState {
  if (!rooms.has(channelId)) {
    rooms.set(channelId, {
      clients: new Set(),
      nodes: [],
      edges: [],
      claims: new Map(),
    });
  }
  return rooms.get(channelId)!;
}

function broadcast(
  channelId: string,
  msg: object,
  exclude?: WebSocket,
  includeSelf = false
): void {
  const room = rooms.get(channelId);
  if (!room) return;
  const json = JSON.stringify(msg);
  for (const c of room.clients) {
    if (!includeSelf && c.ws === exclude) continue;
    if (c.ws.readyState === WebSocket.OPEN) {
      c.ws.send(json);
    }
  }
}

function crewInfo(room: RoomState) {
  return Array.from(room.clients).map((c) => ({
    userId: c.userId,
    username: c.username,
    displayName: c.displayName,
    avatar: c.avatar,
    color: c.color,
  }));
}

// ── Main attach ────────────────────────────────────────────────────────────

export function attachForgeServer(server: HttpServer): void {
  const wss = new WebSocketServer({ server, path: "/forge" });
  logger.info("Forge WebSocket server attached at /forge");

  wss.on("connection", (ws: WebSocket) => {
    let client: CrewMember | null = null;
    let claimTimer: ReturnType<typeof setTimeout> | null = null;

    ws.on("message", (raw) => {
      let msg: any;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      // ── Join ─────────────────────────────────────────────────────
      if (msg.type === "join") {
        const { channelId, userId, username, displayName, avatar } = msg;
        if (!channelId || !userId) return;

        const color = getUserColor(userId);
        client = {
          ws,
          userId,
          username: username || "unknown",
          displayName: displayName || username || "Unknown",
          avatar: avatar ?? null,
          color,
          channelId,
        };

        const room = getOrCreateRoom(channelId);
        // Remove any stale client with same userId (reconnect)
        for (const existing of room.clients) {
          if (existing.userId === userId && existing.ws !== ws) {
            room.clients.delete(existing);
          }
        }
        room.clients.add(client);

        logger.info({ userId, channelId, size: room.clients.size }, "Forge join");

        // Send full room state to this client
        ws.send(
          JSON.stringify({
            type: "forge:state",
            nodes: room.nodes,
            edges: room.edges,
            claims: Object.fromEntries(room.claims),
            crew: crewInfo(room),
          })
        );

        // Tell others someone joined
        broadcast(channelId, {
          type: "crew:join",
          user: { userId, username: client.username, displayName: client.displayName, avatar, color },
        }, ws);

        return;
      }

      if (!client) return;
      const room = rooms.get(client.channelId);
      if (!room) return;

      const { channelId } = client;

      switch (msg.type) {
        // ── Cursor ────────────────────────────────────────────────
        case "cursor":
          broadcast(channelId, {
            type: "cursor",
            userId: client.userId,
            x: msg.x,
            y: msg.y,
          }, ws);
          break;

        // ── Nodes ─────────────────────────────────────────────────
        case "node:add":
          room.nodes.push(msg.node);
          broadcast(channelId, { type: "node:add", node: msg.node, userId: client.userId }, ws);
          break;

        case "node:move":
          {
            const n = room.nodes.find((x: any) => x.id === msg.id) as any;
            if (n) n.position = msg.position;
            broadcast(channelId, { type: "node:move", id: msg.id, position: msg.position, userId: client.userId }, ws);
          }
          break;

        case "node:update":
          {
            const n = room.nodes.find((x: any) => x.id === msg.id) as any;
            if (n) n.data = { ...n.data, ...msg.data };
            broadcast(channelId, { type: "node:update", id: msg.id, data: msg.data, userId: client.userId }, ws);
          }
          break;

        case "node:delete":
          room.nodes = room.nodes.filter((x: any) => x.id !== msg.id);
          room.claims.delete(msg.id);
          broadcast(channelId, { type: "node:delete", id: msg.id, userId: client.userId }, ws);
          break;

        // ── Edges ─────────────────────────────────────────────────
        case "edge:add":
          room.edges.push(msg.edge);
          broadcast(channelId, { type: "edge:add", edge: msg.edge, userId: client.userId }, ws);
          break;

        case "edge:delete":
          room.edges = room.edges.filter((x: any) => x.id !== msg.id);
          broadcast(channelId, { type: "edge:delete", id: msg.id, userId: client.userId }, ws);
          break;

        // ── Claims ────────────────────────────────────────────────
        case "claim:take":
          {
            const existing = room.claims.get(msg.nodeId);
            // Allow override or new claim
            if (!existing || existing === client.userId || msg.override) {
              room.claims.set(msg.nodeId, client.userId);
              broadcast(channelId, {
                type: "claim:take",
                nodeId: msg.nodeId,
                userId: client.userId,
                color: client.color,
              }, ws, true); // includeSelf so claimer also sees their claim
            }
          }
          break;

        case "claim:release":
          if (room.claims.get(msg.nodeId) === client.userId) {
            room.claims.delete(msg.nodeId);
            broadcast(channelId, {
              type: "claim:release",
              nodeId: msg.nodeId,
              userId: client.userId,
            }, ws, true);
          }
          break;
      }
    });

    ws.on("close", () => {
      if (!client) return;
      const room = rooms.get(client.channelId);
      if (!room) return;

      room.clients.delete(client);

      // Release all claims by this user
      for (const [nodeId, uid] of room.claims) {
        if (uid === client.userId) {
          room.claims.delete(nodeId);
          broadcast(client.channelId, { type: "claim:release", nodeId, userId: client.userId }, null, true);
        }
      }

      broadcast(client.channelId, { type: "crew:leave", userId: client.userId }, null);

      logger.info({ userId: client.userId, channelId: client.channelId }, "Forge leave");

      // Clean up empty rooms after grace period
      const cid = client.channelId;
      setTimeout(() => {
        const r = rooms.get(cid);
        if (r && r.clients.size === 0) {
          rooms.delete(cid);
          logger.info({ channelId: cid }, "Forge room cleaned up");
        }
      }, 30_000);
    });

    ws.on("error", (err) => {
      logger.warn({ err }, "Forge WS error");
    });
  });
}
