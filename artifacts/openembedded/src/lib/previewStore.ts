// @ts-nocheck
import { create } from "zustand";
import { AppNode } from "./graphStore.js";
import { Edge } from "@xyflow/react";
import { compileGraph, CompileResult, DiscordMessagePayload } from "./compiler.js";

interface PreviewState {
  payload: DiscordMessagePayload | null;
  isValid: boolean;
  errors: { nodeId: string; message: string }[];
  compile: (nodes: AppNode[], edges: Edge[]) => void;
  /** Custom sender shown when no bot node is connected */
  senderName: string;
  senderAvatarUrl: string;
  setSenderName: (name: string) => void;
  setSenderAvatarUrl: (url: string) => void;
}

export const usePreviewStore = create<PreviewState>((set) => ({
  payload: null,
  isValid: true,
  errors: [],
  compile: (nodes, edges) => {
    const result: CompileResult = compileGraph(nodes, edges);
    set({ payload: result.payload, isValid: result.isValid, errors: result.errors });
  },
  senderName: "MyBot",
  senderAvatarUrl: "",
  setSenderName: (name) => set({ senderName: name.slice(0, 10) }),
  setSenderAvatarUrl: (url) => set({ senderAvatarUrl: url }),
}));
