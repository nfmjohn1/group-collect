/**
 * Integration Tests for Storage + Auth Flow
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storage } from '../../extension/src/services/storage';
import type { User, UserSettings } from '../../extension/src/shared/types';

describe('Storage + Auth Integration', () => {
  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
    
    // Mock chrome.storage with a simple in-memory store
    const memoryStore: Record<string, any> = {};
    
    global.chrome.storage.local.get = vi.fn((keys) => {
      if (typeof keys === 'string') {
        return Promise.resolve({ [keys]: memoryStore[keys] });
      } else if (Array.isArray(keys)) {
        const result: Record<string, any> = {};
        keys.forEach(key => {
          if (memoryStore[key]) result[key] = memoryStore[key];
        });
        return Promise.resolve(result);
      }
      return Promise.resolve(memoryStore);
    });

    global.chrome.storage.local.set = vi.fn((items) => {
      Object.assign(memoryStore, items);
      return Promise.resolve();
    });

    global.chrome.storage.local.remove = vi.fn((keys) => {
      if (typeof keys === 'string') {
        delete memoryStore[keys];
      } else if (Array.isArray(keys)) {
        keys.forEach(key => delete memoryStore[key]);
      }
      return Promise.resolve();
    });

    global.chrome.storage.local.clear = vi.fn(() => {
      Object.keys(memoryStore).forEach(key => delete memoryStore[key]);
      return Promise.resolve();
    });
  });

  describe('Complete Auth Flow', () => {
    it('should handle complete sign-up to sign-out flow', async () => {
      // 1. New user - no data
      let user = await storage.getUser();
      expect(user).toBe(null);

      // 2. User signs up
      const newUser: User = {
        id: 'user123',
        email: 'newuser@example.com',
        created_at: new Date().toISOString(),
      };
      await storage.setUser(newUser);

      // 3. Verify user is stored
      user = await storage.getUser();
      expect(user).toEqual(newUser);

      // 4. User sets up initial settings
      const initialSettings: UserSettings = {
        googleSheetUrl: '',
        selectedGroupId: null,
        activeDeclineFeature: false,
        sendWelcomeMessage: false,
        messageIntervalMins: 1,
        maxMessages: 0,
        messageTemplate: 'Welcome {first_name}!',
      };
      await storage.setSettings(initialSettings);

      // 5. Verify settings are stored
      const settings = await storage.getSettings();
      expect(settings).toEqual(initialSettings);

      // 6. User updates settings
      const updatedSettings: UserSettings = {
        ...initialSettings,
        googleSheetUrl: 'https://docs.google.com/spreadsheets/d/123abc',
        selectedGroupId: 'group456',
      };
      await storage.setSettings(updatedSettings);

      // 7. Verify updated settings
      const finalSettings = await storage.getSettings();
      expect(finalSettings?.googleSheetUrl).toBe('https://docs.google.com/spreadsheets/d/123abc');
      expect(finalSettings?.selectedGroupId).toBe('group456');

      // 8. User signs out
      await storage.removeUser();
      await storage.removeSession();

      // 9. Verify user is removed
      user = await storage.getUser();
      expect(user).toBe(null);

      // 10. Settings should still persist
      const settingsAfterSignOut = await storage.getSettings();
      expect(settingsAfterSignOut).toEqual(updatedSettings);
    });

    it('should handle session persistence', async () => {
      // Simulate storing a session
      const mockSession = {
        access_token: 'token123',
        refresh_token: 'refresh123',
        expires_at: Date.now() + 3600000,
      };

      await storage.setSession(mockSession);

      // Verify session is stored
      const session = await storage.getSession();
      expect(session).toEqual(mockSession);

      // Clear session
      await storage.removeSession();

      // Verify session is removed
      const clearedSession = await storage.getSession();
      expect(clearedSession).toBe(null);
    });
  });

  describe('Data Persistence Across Operations', () => {
    it('should maintain data integrity across multiple operations', async () => {
      const user: User = {
        id: 'user123',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
      };

      const settings: UserSettings = {
        googleSheetUrl: 'https://docs.google.com/spreadsheets/d/123',
        selectedGroupId: 'group1',
        activeDeclineFeature: false,
        sendWelcomeMessage: true,
        messageIntervalMins: 5,
        maxMessages: 10,
        messageTemplate: 'Welcome!',
      };

      // Store both user and settings
      await storage.setUser(user);
      await storage.setSettings(settings);

      // Verify both are stored correctly
      const storedUser = await storage.getUser();
      const storedSettings = await storage.getSettings();

      expect(storedUser).toEqual(user);
      expect(storedSettings).toEqual(settings);

      // Update settings
      const updatedSettings: UserSettings = {
        ...settings,
        messageIntervalMins: 10,
        maxMessages: 20,
      };
      await storage.setSettings(updatedSettings);

      // User should remain unchanged
      const userAfterUpdate = await storage.getUser();
      expect(userAfterUpdate).toEqual(user);

      // Settings should be updated
      const settingsAfterUpdate = await storage.getSettings();
      expect(settingsAfterUpdate?.messageIntervalMins).toBe(10);
      expect(settingsAfterUpdate?.maxMessages).toBe(20);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle missing user gracefully', async () => {
      const user = await storage.getUser();
      expect(user).toBe(null);
    });

    it('should handle missing settings gracefully', async () => {
      const settings = await storage.getSettings();
      expect(settings).toBe(null);
    });

    it('should handle clear all data', async () => {
      // Set up some data
      const user: User = {
        id: 'user123',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
      };
      await storage.setUser(user);

      const settings: UserSettings = {
        googleSheetUrl: 'https://docs.google.com/spreadsheets/d/123',
        selectedGroupId: 'group1',
        activeDeclineFeature: false,
        sendWelcomeMessage: false,
        messageIntervalMins: 1,
        maxMessages: 0,
        messageTemplate: 'Welcome!',
      };
      await storage.setSettings(settings);

      // Clear all data
      await storage.clearAllData();

      // Verify everything is cleared
      const userAfterClear = await storage.getUser();
      const settingsAfterClear = await storage.getSettings();

      expect(userAfterClear).toBe(null);
      expect(settingsAfterClear).toBe(null);
    });
  });
});
