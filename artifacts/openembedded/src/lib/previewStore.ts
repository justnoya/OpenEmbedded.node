import { create } from "zustand";
import { AppNode } from "./graphStore";
import { Edge } from "@xyflow/react";
import { compileGraph, CompileResult, DiscordMessagePayload } from "./compiler";

interface PreviewState {
  payload: DiscordMessagePayload | null;
  isValid: boolean;
  errors: { nodeId: string; message: string }[];
  compile: (nodes: AppNode[], edges: Edge[]) => void;
}

export const usePreviewStore = create<PreviewState>((set) => ({
  payload: null,
  isValid: true,
  errors: [],
  compile: (nodes, edges) => {
    const result: CompileResult = compileGraph(nodes, edges);
    set({ payload: result.payload, isValid: result.isValid, errors: result.errors });
  },
}));
