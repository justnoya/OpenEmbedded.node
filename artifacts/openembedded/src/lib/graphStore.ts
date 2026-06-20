import { create } from 'zustand';
import { Node, Edge, Connection, addEdge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from '@xyflow/react';
import { isValidNodeConnection } from './connectionRules';

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
  /** Reorder the children of a parent node. newChildOrder is the desired child ID sequence. */
  reorderChildEdges: (parentId: string, newChildOrder: string[]) => void;
}

const MAX_HISTORY = 50;

function snap(nodes: AppNode[], edges: Edge[]): Snapshot {
  return { nodes: nodes.map(n => ({ ...n })), edges: edges.map(e => ({ ...e })) };
}

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
    if (!isValidNodeConnection(sourceNode.type ?? "", targetNode.type ?? "")) return;
    set({
      past: [...past.slice(-MAX_HISTORY + 1), snap(nodes, edges)],
      future: [],
      edges: addEdge(connection, edges),
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
    // Edges from this parent, in the new desired order
    const parentEdges = edges.filter(e => e.source === parentId);
    const otherEdges = edges.filter(e => e.source !== parentId);
    const reordered = newChildOrder
      .map(childId => parentEdges.find(e => e.target === childId))
      .filter((e): e is Edge => e !== undefined);
    // Append any parent edges not in newChildOrder (safety net)
    const reorderedIds = new Set(reordered.map(e => e.id));
    const remaining = parentEdges.filter(e => !reorderedIds.has(e.id));
    set({
      past: [...past.slice(-MAX_HISTORY + 1), snap(nodes, edges)],
      future: [],
      edges: [...otherEdges, ...reordered, ...remaining],
    });
  },
}));
