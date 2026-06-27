// @ts-nocheck
import { create } from "zustand";

export type CrewMember = {
  userId: string;
  username: string;
  displayName: string;
  avatar: string | null;
  color: string;
};

export type CursorPos = { x: number; y: number };

export type ClaimInfo = { userId: string; color: string };

export type WizardStep = "welcome" | "tour" | "first-move" | "done";

export type ForgeMode = "solo" | "forge";

interface ForgeState {
  /* Wizard */
  wizardStep: WizardStep;
  setWizardStep: (s: WizardStep) => void;
  wizardDone: boolean;
  markWizardDone: () => void;

  /* Forge connection */
  mode: ForgeMode;
  setMode: (m: ForgeMode) => void;
  isConnected: boolean;
  setConnected: (v: boolean) => void;
  channelId: string | null;
  setChannelId: (id: string | null) => void;

  /* Crew */
  crew: Map<string, CrewMember>;
  addCrewMember: (m: CrewMember) => void;
  removeCrewMember: (userId: string) => void;
  setCrewFull: (members: CrewMember[]) => void;

  /* Cursors */
  cursors: Map<string, CursorPos>;
  setCursor: (userId: string, pos: CursorPos) => void;
  removeCursor: (userId: string) => void;

  /* Claims */
  claims: Map<string, ClaimInfo>;
  setClaim: (nodeId: string, info: ClaimInfo) => void;
  releaseClaim: (nodeId: string) => void;
  releaseAllClaimsBy: (userId: string) => void;

  /* My own userId for self-filtering */
  myUserId: string | null;
  setMyUserId: (id: string) => void;
}

const WIZARD_DONE_KEY = "forge.wizard.done";

export const useForgeStore = create<ForgeState>((set, get) => ({
  /* Wizard */
  wizardStep: localStorage.getItem(WIZARD_DONE_KEY) ? "done" : "welcome",
  setWizardStep: (s) => set({ wizardStep: s }),
  wizardDone: !!localStorage.getItem(WIZARD_DONE_KEY),
  markWizardDone: () => {
    localStorage.setItem(WIZARD_DONE_KEY, "1");
    set({ wizardDone: true, wizardStep: "done" });
  },

  /* Connection */
  mode: "solo",
  setMode: (m) => set({ mode: m }),
  isConnected: false,
  setConnected: (v) => set({ isConnected: v }),
  channelId: null,
  setChannelId: (id) => set({ channelId: id }),

  /* Crew */
  crew: new Map(),
  addCrewMember: (m) =>
    set((s) => { const c = new Map(s.crew); c.set(m.userId, m); return { crew: c }; }),
  removeCrewMember: (userId) =>
    set((s) => { const c = new Map(s.crew); c.delete(userId); return { crew: c }; }),
  setCrewFull: (members) =>
    set({ crew: new Map(members.map((m) => [m.userId, m])) }),

  /* Cursors */
  cursors: new Map(),
  setCursor: (userId, pos) =>
    set((s) => { const c = new Map(s.cursors); c.set(userId, pos); return { cursors: c }; }),
  removeCursor: (userId) =>
    set((s) => { const c = new Map(s.cursors); c.delete(userId); return { cursors: c }; }),

  /* Claims */
  claims: new Map(),
  setClaim: (nodeId, info) =>
    set((s) => { const c = new Map(s.claims); c.set(nodeId, info); return { claims: c }; }),
  releaseClaim: (nodeId) =>
    set((s) => { const c = new Map(s.claims); c.delete(nodeId); return { claims: c }; }),
  releaseAllClaimsBy: (userId) =>
    set((s) => {
      const c = new Map(s.claims);
      for (const [nodeId, info] of c) if (info.userId === userId) c.delete(nodeId);
      return { claims: c };
    }),

  myUserId: null,
  setMyUserId: (id) => set({ myUserId: id }),
}));
