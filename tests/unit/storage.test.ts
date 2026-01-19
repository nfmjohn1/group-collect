/**
 * Unit Tests for Storage Service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getStorageItem,
  setStorageItem,
  removeStorageItem,
  clearStorage,
  storage,
} from '../../extension/src/services/storage';
import type { MemberRequest, User, UserSettings } from '../../extension/src/shared/types';

describe('Storage Service - Basic Operations', () => {
  beforeEach(() => {
    // Reset chrome storage mock
    vi.clearAllMocks();
  });

  describe('getStorageItem', () => {
    it('should retrieve item from storage', async () => {
      const mockData = { testKey: 'testValue' };
      global.chrome.storage.local.get = vi.fn().mockResolvedValue(mockData);

      const result = await getStorageItem('testKey');
      expect(result).toBe('testValue');
    });

    it('should return null for non-existent key', async () => {
      global.chrome.storage.local.get = vi.fn().mockResolvedValue({});

      const result = await getStorageItem('nonExistent');
      expect(result).toBe(null);
    });

    it('should handle errors gracefully', async () => {
      global.chrome.storage.local.get = vi.fn().mockRejectedValue(new Error('Storage error'));

      const result = await getStorageItem('testKey');
      expect(result).toBe(null);
    });
  });

  describe('setStorageItem', () => {
    it('should save item to storage', async () => {
      const setMock = vi.fn().mockResolvedValue(undefined);
      global.chrome.storage.local.set = setMock;

      await setStorageItem('testKey', 'testValue');
      expect(setMock).toHaveBeenCalledWith({ testKey: 'testValue' });
    });

    it('should handle complex objects', async () => {
      const setMock = vi.fn().mockResolvedValue(undefined);
      global.chrome.storage.local.set = setMock;

      const complexObj = { nested: { value: 123 }, array: [1, 2, 3] };
      await setStorageItem('complex', complexObj);
      expect(setMock).toHaveBeenCalledWith({ complex: complexObj });
    });

    it('should throw on storage error', async () => {
      global.chrome.storage.local.set = vi.fn().mockRejectedValue(new Error('Storage full'));

      await expect(setStorageItem('testKey', 'value')).rejects.toThrow();
    });
  });

  describe('removeStorageItem', () => {
    it('should remove item from storage', async () => {
      const removeMock = vi.fn().mockResolvedValue(undefined);
      global.chrome.storage.local.remove = removeMock;

      await removeStorageItem('testKey');
      expect(removeMock).toHaveBeenCalledWith('testKey');
    });
  });

  describe('clearStorage', () => {
    it('should clear all storage', async () => {
      const clearMock = vi.fn().mockResolvedValue(undefined);
      global.chrome.storage.local.clear = clearMock;

      await clearStorage();
      expect(clearMock).toHaveBeenCalled();
    });
  });
});

describe('Storage Service - Typed Methods', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('User Methods', () => {
    it('should get user from storage', async () => {
      const mockUser: User = {
        id: '123',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
      };
      global.chrome.storage.local.get = vi.fn().mockResolvedValue({
        auth_user: mockUser,
      });

      const user = await storage.getUser();
      expect(user).toEqual(mockUser);
    });

    it('should set user in storage', async () => {
      const mockUser: User = {
        id: '123',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
      };
      const setMock = vi.fn().mockResolvedValue(undefined);
      global.chrome.storage.local.set = setMock;

      await storage.setUser(mockUser);
      expect(setMock).toHaveBeenCalledWith({ auth_user: mockUser });
    });

    it('should remove user from storage', async () => {
      const removeMock = vi.fn().mockResolvedValue(undefined);
      global.chrome.storage.local.remove = removeMock;

      await storage.removeUser();
      expect(removeMock).toHaveBeenCalledWith('auth_user');
    });
  });

  describe('Members Methods', () => {
    it('should get empty array when no members exist', async () => {
      global.chrome.storage.local.get = vi.fn().mockResolvedValue({});

      const members = await storage.getMembers();
      expect(members).toEqual([]);
    });

    it('should get members from storage', async () => {
      const mockMembers: MemberRequest[] = [
        {
          id: '1',
          groupName: 'Test Group',
          userId: 'user1',
          facebookUsername: 'johndoe',
          joinedOn: new Date(),
          status: 'pending',
          dateAdded: new Date(),
        },
      ];
      global.chrome.storage.local.get = vi.fn().mockResolvedValue({
        members_data: mockMembers,
      });

      const members = await storage.getMembers();
      expect(members).toEqual(mockMembers);
    });

    it('should add member to storage', async () => {
      const existingMembers: MemberRequest[] = [];
      global.chrome.storage.local.get = vi.fn().mockResolvedValue({
        members: existingMembers,
      });
      const setMock = vi.fn().mockResolvedValue(undefined);
      global.chrome.storage.local.set = setMock;

      const newMember: MemberRequest = {
        id: '1',
        groupName: 'Test Group',
        userId: 'user1',
        facebookUsername: 'johndoe',
        joinedOn: new Date(),
        status: 'pending',
        dateAdded: new Date(),
      };

      await storage.addMember(newMember);
      expect(setMock).toHaveBeenCalledWith({
        members_data: [newMember],
      });
    });

    it('should update existing member', async () => {
      const existingMembers: MemberRequest[] = [
        {
          id: '1',
          groupName: 'Test Group',
          userId: 'user1',
          facebookUsername: 'johndoe',
          joinedOn: new Date(),
          status: 'pending',
          dateAdded: new Date(),
        },
      ];
      global.chrome.storage.local.get = vi.fn().mockResolvedValue({
        members_data: existingMembers,
      });
      const setMock = vi.fn().mockResolvedValue(undefined);
      global.chrome.storage.local.set = setMock;

      await storage.updateMember('1', { status: 'approved' });

      const savedMembers = setMock.mock.calls[0][0].members_data;
      expect(savedMembers[0].status).toBe('approved');
    });

    it('should remove member from storage', async () => {
      const existingMembers: MemberRequest[] = [
        {
          id: '1',
          groupName: 'Test Group',
          userId: 'user1',
          facebookUsername: 'johndoe',
          joinedOn: new Date(),
          status: 'pending',
          dateAdded: new Date(),
        },
        {
          id: '2',
          groupName: 'Test Group',
          userId: 'user2',
          facebookUsername: 'janedoe',
          joinedOn: new Date(),
          status: 'pending',
          dateAdded: new Date(),
        },
      ];
      global.chrome.storage.local.get = vi.fn().mockResolvedValue({
        members_data: existingMembers,
      });
      const setMock = vi.fn().mockResolvedValue(undefined);
      global.chrome.storage.local.set = setMock;

      await storage.removeMember('1');

      const savedMembers = setMock.mock.calls[0][0].members_data;
      expect(savedMembers).toHaveLength(1);
      expect(savedMembers[0].id).toBe('2');
    });
  });

  describe('Settings Methods', () => {
    it('should get settings from storage', async () => {
      const mockSettings: UserSettings = {
        googleSheetUrl: 'https://docs.google.com/spreadsheets/d/123',
        selectedGroupId: 'group1',
        activeDeclineFeature: false,
        sendWelcomeMessage: false,
        messageIntervalMins: 1,
        maxMessages: 0,
        messageTemplate: 'Welcome {first_name}!',
      };
      global.chrome.storage.local.get = vi.fn().mockResolvedValue({
        user_settings: mockSettings,
      });

      const settings = await storage.getSettings();
      expect(settings).toEqual(mockSettings);
    });

    it('should set settings in storage', async () => {
      const mockSettings: UserSettings = {
        googleSheetUrl: 'https://docs.google.com/spreadsheets/d/123',
        selectedGroupId: 'group1',
        activeDeclineFeature: false,
        sendWelcomeMessage: false,
        messageIntervalMins: 1,
        maxMessages: 0,
        messageTemplate: 'Welcome!',
      };
      const setMock = vi.fn().mockResolvedValue(undefined);
      global.chrome.storage.local.set = setMock;

      await storage.setSettings(mockSettings);
      expect(setMock).toHaveBeenCalledWith({ user_settings: mockSettings });
    });
  });

  describe('Message Log Methods', () => {
    it('should get empty message log when none exist', async () => {
      global.chrome.storage.local.get = vi.fn().mockResolvedValue({});

      const log = await storage.getMessageLog();
      expect(log).toEqual([]);
    });

    it('should add message log entry', async () => {
      global.chrome.storage.local.get = vi.fn().mockResolvedValue({
        message_log: [],
      });
      const setMock = vi.fn().mockResolvedValue(undefined);
      global.chrome.storage.local.set = setMock;

      const logEntry = {
        id: '1',
        memberId: 'member1',
        messageContent: 'Welcome!',
        sentAt: new Date(),
        status: 'sent' as const,
      };

      await storage.addMessageLog(logEntry);
      expect(setMock).toHaveBeenCalledWith({
        message_log: [logEntry],
      });
    });
  });

  describe('Decline Log Methods', () => {
    it('should get empty decline log when none exist', async () => {
      global.chrome.storage.local.get = vi.fn().mockResolvedValue({});

      const log = await storage.getDeclineLog();
      expect(log).toEqual([]);
    });

    it('should add decline log entry', async () => {
      global.chrome.storage.local.get = vi.fn().mockResolvedValue({
        decline_log: [],
      });
      const setMock = vi.fn().mockResolvedValue(undefined);
      global.chrome.storage.local.set = setMock;

      const logEntry = {
        id: '1',
        memberId: 'member1',
        declineReason: 'Missing email',
        declinedAt: new Date(),
      };

      await storage.addDeclineLog(logEntry);
      expect(setMock).toHaveBeenCalledWith({
        decline_log: [logEntry],
      });
    });
  });

  describe('clearAllData', () => {
    it('should clear all storage data', async () => {
      const clearMock = vi.fn().mockResolvedValue(undefined);
      global.chrome.storage.local.clear = clearMock;

      await storage.clearAllData();
      expect(clearMock).toHaveBeenCalled();
    });
  });
});
