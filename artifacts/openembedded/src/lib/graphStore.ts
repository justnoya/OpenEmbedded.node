import { create } from 'zustand';
import { Node, Edge, Connection, addEdge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from '@xyflow/react';
import { isValidNodeConnection, isInteractionConnection, isBotSendConnection, InteractionMode } from './connectionRules';

export type DiscordComponentType = 'container' | 'section' | 'text' | 'thumbnail' | 'media' | 'separator' | 'actionRow' | 'button' | 'embed';

export type AppNodeData = {
  type: DiscordComponentType;
  componentType?: number;
  [key: string]: unknown;
};

export type AppNode = Node<AppNodeData>;

type Snapshot = { nodes: AppNode[]; edges: Edge[] };

interface GraphState {
  nodes: AppNode[];
  edges: Edge[];
  selectedNodeId: string | null;
  past: Snapshot[];
  future: Snapshot[];
  addNode: (node: AppNode) => void;
  updateNodeData: (id: string, data: Partial<AppNodeData>) => void;
  updateEdgeData: (id: string, data: Record<string, unknown>) => void;
  removeNode: (id: string) => void;
  removeEdge: (id: string) => void;
  setSelectedNode: (id: string | null) => void;
  onNodesChange: (changes: NodeChange<AppNode>[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  setGraph: (nodes: AppNode[], edges: Edge[]) => void;
  clear: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  reorderChildEdges: (parentId: string, newChildOrder: string[]) => void;
}

const MAX_HISTORY = 50;

function snap(nodes: AppNode[], edges: Edge[]): Snapshot {
  return { nodes: nodes.map(n => ({ ...n })), edges: edges.map(e => ({ ...e })) };
}

let edgeIdCounter = Date.now();

export const useGraphStore = create<GraphState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  past: [],
  future: [],

  addNode: (node) => {
    const { nodes, edges, past } = get();
    set({
      past: [...past.slice(-MAX_HISTORY + 1), snap(nodes, edges)],
      future: [],
      nodes: [...nodes, node],
    });
  },

  updateNodeData: (id, data) => {
    const { nodes, edges, past } = get();
    set({
      past: [...past.slice(-MAX_HISTORY + 1), snap(nodes, edges)],
      future: [],
      nodes: nodes.map(n => n.id === id ? { ...n, data: { ...n.data, ...data } } : n),
    });
  },

  /** Update edge data without touching undo history (used for quick mode changes). */
  updateEdgeData: (id, data) => {
    set({
      edges: get().edges.map(e =>
        e.id === id ? { ...e, data: { ...(e.data ?? {}), ...data } } : e
      ),
    });
  },

  removeNode: (id) => {
    const { nodes, edges, past, selectedNodeId } = get();
    set({
      past: [...past.slice(-MAX_HISTORY + 1), snap(nodes, edges)],
      future: [],
      nodes: nodes.filter(n => n.id !== id),
      edges: edges.filter(e => e.source !== id && e.target !== id),
      selectedNodeId: selectedNodeId === id ? null : selectedNodeId,
    });
  },

  removeEdge: (id) => {
    const { nodes, edges, past } = get();
    set({
      past: [...past.slice(-MAX_HISTORY + 1), snap(nodes, edges)],
      future: [],
      edges: edges.filter(e => e.id !== id),
    });
  },

  setSelectedNode: (id) => set({ selectedNodeId: id }),

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },

  onConnect: (connection) => {
    const { nodes, edges, past } = get();
    const sourceNode = nodes.find((n) => n.id === connection.source);
    const targetNode = nodes.find((n) => n.id === connection.target);
    if (!sourceNode || !targetNode) return;

    const srcType = sourceNode.type ?? "";
    const tgtType = targetNode.type ?? "";

    // ── Bot send edge (bot → container/embed) ────────────────────────────────
    if (isBotSendConnection(srcType, tgtType)) {
      // Only one send connection allowed per bot node
      const alreadySending = edges.some((e) => e.type === "send" && e.source === connection.source);
      if (alreadySending) return;
      const sendEdge: Edge = {
        id: `send_${edgeIdCounter++}`,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle ?? undefined,
        targetHandle: connection.targetHandle ?? undefined,
        type: "send",
      };
      set({
        past: [...past.slice(-MAX_HISTORY + 1), snap(nodes, edges)],
        future: [],
        edges: [...edges, sendEdge],
      });
      return;
    }

    // ── Interaction edge (button/select → container/embed) ───────────────────
    if (isInteractionConnection(srcType, tgtType)) {
      const interactionEdge: Edge = {
        id: `ie_${edgeIdCounter++}`,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle ?? undefined,
        targetHandle: connection.targetHandle ?? undefined,
        type: "interaction",
        data: { mode: "send_new" as InteractionMode },
      };
      set({
        past: [...past.slice(-MAX_HISTORY + 1), snap(nodes, edges)],
        future: [],
        edges: [...edges, interactionEdge],
      });
      return;
    }

    // ── Structural edge (parent → child) ────────────────────────────────────
    if (!isValidNodeConnection(srcType, tgtType)) return;
    set({
      past: [...past.slice(-MAX_HISTORY + 1), snap(nodes, edges)],
      future: [],
      edges: addEdge({ ...connection, type: "default" }, edges),
    });
  },

  setGraph: (nodes, edges) =>
    set({ nodes, edges, past: [], future: [], selectedNodeId: null }),

  clear: () =>
    set({ nodes: [], edges: [], selectedNodeId: null, past: [], future: [] }),

  undo: () => {
    const { past, nodes, edges, future } = get();
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    set({
      past: past.slice(0, -1),
      nodes: previous.nodes,
      edges: previous.edges,
      future: [snap(nodes, edges), ...future.slice(0, MAX_HISTORY - 1)],
      selectedNodeId: null,
    });
  },

  redo: () => {
    const { future, nodes, edges, past } = get();
    if (future.length === 0) return;
    const next = future[0];
    set({
      past: [...past.slice(-MAX_HISTORY + 1), snap(nodes, edges)],
      nodes: next.nodes,
      edges: next.edges,
      future: future.slice(1),
      selectedNodeId: null,
    });
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  reorderChildEdges: (parentId, newChildOrder) => {
    const { edges, nodes, past } = get();
    const parentEdges = edges.filter(e => e.source === parentId);
    const otherEdges = edges.filter(e => e.source !== parentId);
    const reordered = newChildOrder
      .map(childId => parentEdges.find(e => e.target === childId))
      .filter((e): e is Edge => e !== undefined);
    const reorderedIds = new Set(reordered.map(e => e.id));
    const remaining = parentEdges.filter(e => !reorderedIds.has(e.id));
    set({
      past: [...past.slice(-MAX_HISTORY + 1), snap(nodes, edges)],
      future: [],
      edges: [...otherEdges, ...reordered, ...remaining],
    });
  },
}));
