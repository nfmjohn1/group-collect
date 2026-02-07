/**
 * Integration Tests for Member Operations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storage } from '../../extension/src/services/storage';
import type { MemberRequest, MessageLog, DeclineLog } from '../../extension/src/shared/types';

describe('Member Operations Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock chrome.storage with in-memory store
    const memoryStore: Record<string, any> = {};
    
    global.chrome.storage.local.get = vi.fn((keys) => {
      if (typeof keys === 'string') {
        return Promise.resolve({ [keys]: memoryStore[keys] });
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
      }
      return Promise.resolve();
    });

    global.chrome.storage.local.clear = vi.fn(() => {
      Object.keys(memoryStore).forEach(key => delete memoryStore[key]);
      return Promise.resolve();
    });
  });

  describe('Complete Member Lifecycle', () => {
    it('should handle member from pending to approved', async () => {
      // 1. Initially no members
      let members = await storage.getMembers();
      expect(members).toEqual([]);

      // 2. Add a pending member
      const pendingMember: MemberRequest = {
        id: 'member1',
        groupName: 'Test Group',
        userId: 'fb_user_123',
        facebookUsername: 'johndoe',
        joinedOn: new Date('2024-01-15'),
        q1: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        status: 'pending',
        dateAdded: new Date(),
      };

      await storage.addMember(pendingMember);

      // 3. Verify member was added
      members = await storage.getMembers();
      expect(members).toHaveLength(1);
      expect(members[0].status).toBe('pending');

      // 4. Approve the member
      await storage.updateMember('member1', { status: 'approved' });

      // 5. Verify member was approved
      members = await storage.getMembers();
      expect(members[0].status).toBe('approved');

      // 6. Log a welcome message
      const messageLog: MessageLog = {
        id: 'msg1',
        memberId: 'member1',
        messageContent: 'Welcome John!',
        sentAt: new Date(),
        status: 'sent',
      };
      await storage.addMessageLog(messageLog);

      // 7. Verify message was logged
      const messageLogs = await storage.getMessageLog();
      expect(messageLogs).toHaveLength(1);
      expect(messageLogs[0].memberId).toBe('member1');
    });

    it('should handle member decline workflow', async () => {
      // 1. Add a member with missing email
      const member: MemberRequest = {
        id: 'member2',
        groupName: 'Test Group',
        userId: 'fb_user_456',
        facebookUsername: 'janedoe',
        joinedOn: new Date(),
        q1: '', // No email
        status: 'pending',
        dateAdded: new Date(),
      };

      await storage.addMember(member);

      // 2. Decline the member
      await storage.updateMember('member2', { status: 'declined' });

      // 3. Log the decline
      const declineLog: DeclineLog = {
        id: 'decline1',
        memberId: 'member2',
        declineReason: 'Missing email address',
        declinedAt: new Date(),
      };
      await storage.addDeclineLog(declineLog);

      // 4. Verify member was declined
      const members = await storage.getMembers();
      expect(members[0].status).toBe('declined');

      // 5. Verify decline was logged
      const declineLogs = await storage.getDeclineLog();
      expect(declineLogs).toHaveLength(1);
      expect(declineLogs[0].declineReason).toBe('Missing email address');
    });
  });

  describe('Bulk Member Operations', () => {
    it('should handle adding multiple members', async () => {
      const members: MemberRequest[] = [
        {
          id: 'member1',
          groupName: 'Test Group',
          userId: 'user1',
          facebookUsername: 'user1',
          joinedOn: new Date(),
          status: 'pending',
          dateAdded: new Date(),
        },
        {
          id: 'member2',
          groupName: 'Test Group',
          userId: 'user2',
          facebookUsername: 'user2',
          joinedOn: new Date(),
          status: 'pending',
          dateAdded: new Date(),
        },
        {
          id: 'member3',
          groupName: 'Test Group',
          userId: 'user3',
          facebookUsername: 'user3',
          joinedOn: new Date(),
          status: 'pending',
          dateAdded: new Date(),
        },
      ];

      // Add members one by one
      for (const member of members) {
        await storage.addMember(member);
      }

      // Verify all members were added
      const storedMembers = await storage.getMembers();
      expect(storedMembers).toHaveLength(3);
    });

    it('should handle bulk updates', async () => {
      // Set up initial members
      const members: MemberRequest[] = [
        {
          id: 'member1',
          groupName: 'Test Group',
          userId: 'user1',
          facebookUsername: 'user1',
          joinedOn: new Date(),
          status: 'pending',
          dateAdded: new Date(),
        },
        {
          id: 'member2',
          groupName: 'Test Group',
          userId: 'user2',
          facebookUsername: 'user2',
          joinedOn: new Date(),
          status: 'pending',
          dateAdded: new Date(),
        },
      ];

      await storage.setMembers(members);

      // Update both members
      await storage.updateMember('member1', { status: 'approved' });
      await storage.updateMember('member2', { status: 'declined' });

      // Verify updates
      const updatedMembers = await storage.getMembers();
      expect(updatedMembers[0].status).toBe('approved');
      expect(updatedMembers[1].status).toBe('declined');
    });

    it('should handle removing multiple members', async () => {
      const members: MemberRequest[] = [
        {
          id: 'member1',
          groupName: 'Test Group',
          userId: 'user1',
          facebookUsername: 'user1',
          joinedOn: new Date(),
          status: 'pending',
          dateAdded: new Date(),
        },
        {
          id: 'member2',
          groupName: 'Test Group',
          userId: 'user2',
          facebookUsername: 'user2',
          joinedOn: new Date(),
          status: 'pending',
          dateAdded: new Date(),
        },
        {
          id: 'member3',
          groupName: 'Test Group',
          userId: 'user3',
          facebookUsername: 'user3',
          joinedOn: new Date(),
          status: 'pending',
          dateAdded: new Date(),
        },
      ];

      await storage.setMembers(members);

      // Remove two members
      await storage.removeMember('member1');
      await storage.removeMember('member3');

      // Verify only member2 remains
      const remainingMembers = await storage.getMembers();
      expect(remainingMembers).toHaveLength(1);
      expect(remainingMembers[0].id).toBe('member2');
    });
  });

  describe('Message and Decline Logs', () => {
    it('should maintain separate logs for messages and declines', async () => {
      // Add members
      const member1: MemberRequest = {
        id: 'member1',
        groupName: 'Test Group',
        userId: 'user1',
        facebookUsername: 'user1',
        joinedOn: new Date(),
        status: 'approved',
        dateAdded: new Date(),
      };

      const member2: MemberRequest = {
        id: 'member2',
        groupName: 'Test Group',
        userId: 'user2',
        facebookUsername: 'user2',
        joinedOn: new Date(),
        status: 'declined',
        dateAdded: new Date(),
      };

      await storage.addMember(member1);
      await storage.addMember(member2);

      // Log welcome message for approved member
      const messageLog: MessageLog = {
        id: 'msg1',
        memberId: 'member1',
        messageContent: 'Welcome!',
        sentAt: new Date(),
        status: 'sent',
      };
      await storage.addMessageLog(messageLog);

      // Log decline for declined member
      const declineLog: DeclineLog = {
        id: 'decline1',
        memberId: 'member2',
        declineReason: 'No email',
        declinedAt: new Date(),
      };
      await storage.addDeclineLog(declineLog);

      // Verify both logs are separate
      const messageLogs = await storage.getMessageLog();
      const declineLogs = await storage.getDeclineLog();

      expect(messageLogs).toHaveLength(1);
      expect(declineLogs).toHaveLength(1);
      expect(messageLogs[0].memberId).toBe('member1');
      expect(declineLogs[0].memberId).toBe('member2');
    });

    it('should handle multiple logs per member', async () => {
      // Add a member
      const member: MemberRequest = {
        id: 'member1',
        groupName: 'Test Group',
        userId: 'user1',
        facebookUsername: 'user1',
        joinedOn: new Date(),
        status: 'approved',
        dateAdded: new Date(),
      };

      await storage.addMember(member);

      // Send multiple messages
      const message1: MessageLog = {
        id: 'msg1',
        memberId: 'member1',
        messageContent: 'Welcome!',
        sentAt: new Date(),
        status: 'sent',
      };

      const message2: MessageLog = {
        id: 'msg2',
        memberId: 'member1',
        messageContent: 'Follow-up message',
        sentAt: new Date(),
        status: 'sent',
      };

      await storage.addMessageLog(message1);
      await storage.addMessageLog(message2);

      // Verify both messages are logged
      const messageLogs = await storage.getMessageLog();
      expect(messageLogs).toHaveLength(2);
    });
  });

  describe('Data Cleanup', () => {
    it('should clear all member-related data', async () => {
      // Set up complete data
      const member: MemberRequest = {
        id: 'member1',
        groupName: 'Test Group',
        userId: 'user1',
        facebookUsername: 'user1',
        joinedOn: new Date(),
        status: 'approved',
        dateAdded: new Date(),
      };

      await storage.addMember(member);

      const messageLog: MessageLog = {
        id: 'msg1',
        memberId: 'member1',
        messageContent: 'Welcome!',
        sentAt: new Date(),
        status: 'sent',
      };

      await storage.addMessageLog(messageLog);

      // Clear all data
      await storage.clearAllData();

      // Verify everything is cleared
      const members = await storage.getMembers();
      const messageLogs = await storage.getMessageLog();
      const declineLogs = await storage.getDeclineLog();

      expect(members).toEqual([]);
      expect(messageLogs).toEqual([]);
      expect(declineLogs).toEqual([]);
    });
  });
});
