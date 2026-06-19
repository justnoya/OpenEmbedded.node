import { create } from 'zustand';

interface SettingsState {
  webhookUrl: string;
  setWebhookUrl: (url: string) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  webhookUrl: '',
  setWebhookUrl: (url) => set({ webhookUrl: url }),
}));
