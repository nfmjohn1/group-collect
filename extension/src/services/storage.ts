import { STORAGE_KEYS } from '@/shared/constants';
import type { User, UserSettings, MemberRequest, MessageLog, DeclineLog } from '@/shared/types';

/**
 * Chrome Storage API wrapper for type-safe storage operations
 */

// Get items from storage
export async function getStorageItem<T>(key: string): Promise<T | null> {
  try {
    const result = await chrome.storage.local.get(key);
    return result[key] || null;
  } catch (error) {
    console.error('Error getting storage item:', error);
    return null;
  }
}

// Set items in storage
export async function setStorageItem<T>(key: string, value: T): Promise<void> {
  try {
    await chrome.storage.local.set({ [key]: value });
  } catch (error) {
    console.error('Error setting storage item:', error);
    throw error;
  }
}

// Remove items from storage
export async function removeStorageItem(key: string): Promise<void> {
  try {
    await chrome.storage.local.remove(key);
  } catch (error) {
    console.error('Error removing storage item:', error);
    throw error;
  }
}

// Clear all storage
export async function clearStorage(): Promise<void> {
  try {
    await chrome.storage.local.clear();
  } catch (error) {
    console.error('Error clearing storage:', error);
    throw error;
  }
}

// Specific storage methods for type safety
export const storage = {
  // Auth
  async getUser(): Promise<User | null> {
    return getStorageItem<User>(STORAGE_KEYS.AUTH_USER);
  },
  async setUser(user: User): Promise<void> {
    return setStorageItem(STORAGE_KEYS.AUTH_USER, user);
  },
  async removeUser(): Promise<void> {
    return removeStorageItem(STORAGE_KEYS.AUTH_USER);
  },

  async getSession(): Promise<any | null> {
    return getStorageItem<any>(STORAGE_KEYS.AUTH_SESSION);
  },
  async setSession(session: any): Promise<void> {
    return setStorageItem(STORAGE_KEYS.AUTH_SESSION, session);
  },
  async removeSession(): Promise<void> {
    return removeStorageItem(STORAGE_KEYS.AUTH_SESSION);
  },

  // Settings
  async getSettings(): Promise<UserSettings | null> {
    return getStorageItem<UserSettings>(STORAGE_KEYS.SETTINGS);
  },
  async setSettings(settings: UserSettings): Promise<void> {
    return setStorageItem(STORAGE_KEYS.SETTINGS, settings);
  },

  // Members
  async getMembers(): Promise<MemberRequest[]> {
    const members = await getStorageItem<MemberRequest[]>(STORAGE_KEYS.MEMBERS);
    return members || [];
  },
  async setMembers(members: MemberRequest[]): Promise<void> {
    return setStorageItem(STORAGE_KEYS.MEMBERS, members);
  },
  async addMember(member: MemberRequest): Promise<void> {
    const members = await this.getMembers();
    members.push(member);
    return setStorageItem(STORAGE_KEYS.MEMBERS, members);
  },
  async updateMember(memberId: string, updates: Partial<MemberRequest>): Promise<void> {
    const members = await this.getMembers();
    const index = members.findIndex(m => m.id === memberId);
    if (index !== -1) {
      members[index] = { ...members[index], ...updates };
      return setStorageItem(STORAGE_KEYS.MEMBERS, members);
    }
  },
  async removeMember(memberId: string): Promise<void> {
    const members = await this.getMembers();
    const filtered = members.filter(m => m.id !== memberId);
    return setStorageItem(STORAGE_KEYS.MEMBERS, filtered);
  },

  // Message Log
  async getMessageLog(): Promise<MessageLog[]> {
    const log = await getStorageItem<MessageLog[]>(STORAGE_KEYS.MESSAGE_LOG);
    return log || [];
  },
  async addMessageLog(log: MessageLog): Promise<void> {
    const logs = await this.getMessageLog();
    logs.push(log);
    return setStorageItem(STORAGE_KEYS.MESSAGE_LOG, logs);
  },

  // Decline Log
  async getDeclineLog(): Promise<DeclineLog[]> {
    const log = await getStorageItem<DeclineLog[]>(STORAGE_KEYS.DECLINE_LOG);
    return log || [];
  },
  async addDeclineLog(log: DeclineLog): Promise<void> {
    const logs = await this.getDeclineLog();
    logs.push(log);
    return setStorageItem(STORAGE_KEYS.DECLINE_LOG, logs);
  },

  // Clear all app data
  async clearAllData(): Promise<void> {
    return clearStorage();
  },
};
