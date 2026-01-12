import { create } from 'zustand';
import { storage } from '@/services/storage';
import { DEFAULT_SETTINGS } from '@/shared/constants';
import type { UserSettings } from '@/shared/types';

interface SettingsState {
  settings: UserSettings;
  isLoading: boolean;

  // Actions
  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoading: true,

  loadSettings: async () => {
    try {
      set({ isLoading: true });
      const settings = await storage.getSettings();
      set({
        settings: settings || DEFAULT_SETTINGS,
        isLoading: false
      });
    } catch (error) {
      console.error('Error loading settings:', error);
      set({ isLoading: false });
    }
  },

  updateSettings: async (updates: Partial<UserSettings>) => {
    try {
      const currentSettings = get().settings;
      const newSettings = {
        ...currentSettings,
        ...updates,
        updatedAt: new Date(),
      };
      await storage.setSettings(newSettings);
      set({ settings: newSettings });
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  },

  resetSettings: async () => {
    try {
      await storage.setSettings(DEFAULT_SETTINGS);
      set({ settings: DEFAULT_SETTINGS });
    } catch (error) {
      console.error('Error resetting settings:', error);
      throw error;
    }
  },
}));
