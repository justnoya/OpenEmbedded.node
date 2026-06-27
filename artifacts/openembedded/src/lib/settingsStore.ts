// @ts-nocheck
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  webhookUrl: string;
  setWebhookUrl: (url: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      webhookUrl: '',
      setWebhookUrl: (url) => set({ webhookUrl: url }),
    }),
    { name: 'openembedded-settings' }
  )
);
