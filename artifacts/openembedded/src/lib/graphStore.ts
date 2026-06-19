import { create } from 'zustand';
import { Node, Edge, Connection, addEdge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from '@xyflow/react';

export type DiscordComponentType = 'container' | 'section' | 'text' | 'thumbnail' | 'media' | 'separator' | 'actionRow' | 'button' | 'embed';

export type AppNodeData = {
  type: DiscordComponentType;
  [key: string]: any;
};

export type AppNode = Node<AppNodeData>;

interface GraphState {
  nodes: AppNode[];
  edges: Edge[];
  selectedNodeId: string | null;
  addNode: (node: AppNode) => void;
  updateNodeData: (id: string, data: Partial<AppNodeData>) => void;
  removeNode: (id: string) => void;
  setSelectedNode: (id: string | null) => void;
  onNodesChange: (changes: NodeChange<AppNode>[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  setGraph: (nodes: AppNode[], edges: Edge[]) => void;
  clear: () => void;
}

export const useGraphStore = create<GraphState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  addNode: (node) => set({ nodes: [...get().nodes, node] }),
  updateNodeData: (id, data) => set({
    nodes: get().nodes.map(n => n.id === id ? { ...n, data: { ...n.data, ...data } } : n)
  }),
  removeNode: (id) => set({
    nodes: get().nodes.filter(n => n.id !== id),
    edges: get().edges.filter(e => e.source !== id && e.target !== id),
    selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId
  }),
  setSelectedNode: (id) => set({ selectedNodeId: id }),
  onNodesChange: (changes) => set({ nodes: applyNodeChanges(changes, get().nodes) }),
  onEdgesChange: (changes) => set({ edges: applyEdgeChanges(changes, get().edges) }),
  onConnect: (connection) => set({ edges: addEdge(connection, get().edges) }),
  setGraph: (nodes, edges) => set({ nodes, edges }),
  clear: () => set({ nodes: [], edges: [], selectedNodeId: null }),
}));
