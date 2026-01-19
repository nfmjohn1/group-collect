/**
 * Unit Tests for Zustand Stores
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '../../extension/src/store/authStore';
import { useMemberStore } from '../../extension/src/store/memberStore';
import type { User, MemberRequest } from '../../extension/src/shared/types';

// Mock the services
vi.mock('../../extension/src/services/auth', () => ({
  authService: {
    signUp: vi.fn(),
    signIn: vi.fn(),
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
  },
}));

vi.mock('../../extension/src/services/storage', () => ({
  storage: {
    getUser: vi.fn(),
    getMembers: vi.fn(),
    addMember: vi.fn(),
    updateMember: vi.fn(),
    removeMember: vi.fn(),
    setMembers: vi.fn(),
  },
}));

describe('AuthStore', () => {
  beforeEach(() => {
    // Reset the store state before each test
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAuthStore());
      expect(result.current.user).toBe(null);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('signUp', () => {
    it('should sign up a user successfully', async () => {
      const mockUser: User = {
        id: '123',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
      };

      const { authService } = await import('../../extension/src/services/auth');
      const { storage } = await import('../../extension/src/services/storage');

      vi.mocked(authService.signUp).mockResolvedValue(undefined);
      vi.mocked(storage.getUser).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.signUp('test@example.com', 'password123');
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle sign up errors', async () => {
      const { authService } = await import('../../extension/src/services/auth');
      vi.mocked(authService.signUp).mockRejectedValue(new Error('Sign up failed'));

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.signUp('test@example.com', 'password123');
        } catch (error) {
          // Expected error
        }
      });

      expect(result.current.error).toBe('Sign up failed');
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('signIn', () => {
    it('should sign in a user successfully', async () => {
      const mockUser: User = {
        id: '123',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
      };

      const { authService } = await import('../../extension/src/services/auth');
      const { storage } = await import('../../extension/src/services/storage');

      vi.mocked(authService.signIn).mockResolvedValue(undefined);
      vi.mocked(storage.getUser).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('signOut', () => {
    it('should sign out user successfully', async () => {
      const mockUser: User = {
        id: '123',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
      };

      // Set initial authenticated state
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
      });

      const { authService } = await import('../../extension/src/services/auth');
      vi.mocked(authService.signOut).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.signOut();
      });

      expect(result.current.user).toBe(null);
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('loadUser', () => {
    it('should load user from storage', async () => {
      const mockUser: User = {
        id: '123',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
      };

      const { storage } = await import('../../extension/src/services/storage');
      vi.mocked(storage.getUser).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.loadUser();
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle no user in storage', async () => {
      const { storage } = await import('../../extension/src/services/storage');
      vi.mocked(storage.getUser).mockResolvedValue(null);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.loadUser();
      });

      expect(result.current.user).toBe(null);
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('clearError', () => {
    it('should clear error state', () => {
      useAuthStore.setState({ error: 'Some error' });

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });
});

describe('MemberStore', () => {
  beforeEach(() => {
    // Reset the store state before each test
    useMemberStore.setState({
      members: [],
      isLoading: false,
      selectedGroup: null,
    });
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useMemberStore());
      expect(result.current.members).toEqual([]);
      expect(result.current.selectedGroup).toBe(null);
    });
  });

  describe('loadMembers', () => {
    it('should load members from storage', async () => {
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

      const { storage } = await import('../../extension/src/services/storage');
      vi.mocked(storage.getMembers).mockResolvedValue(mockMembers);

      const { result } = renderHook(() => useMemberStore());

      await act(async () => {
        await result.current.loadMembers();
      });

      expect(result.current.members).toEqual(mockMembers);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle errors when loading members', async () => {
      const { storage } = await import('../../extension/src/services/storage');
      vi.mocked(storage.getMembers).mockRejectedValue(new Error('Load failed'));

      const { result } = renderHook(() => useMemberStore());

      await act(async () => {
        await result.current.loadMembers();
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('addMember', () => {
    it('should add a new member', async () => {
      const newMember: MemberRequest = {
        id: '1',
        groupName: 'Test Group',
        userId: 'user1',
        facebookUsername: 'johndoe',
        joinedOn: new Date(),
        status: 'pending',
        dateAdded: new Date(),
      };

      const { storage } = await import('../../extension/src/services/storage');
      vi.mocked(storage.addMember).mockResolvedValue(undefined);

      const { result } = renderHook(() => useMemberStore());

      await act(async () => {
        await result.current.addMember(newMember);
      });

      expect(result.current.members).toContainEqual(newMember);
    });
  });

  describe('updateMember', () => {
    it('should update an existing member', async () => {
      const initialMember: MemberRequest = {
        id: '1',
        groupName: 'Test Group',
        userId: 'user1',
        facebookUsername: 'johndoe',
        joinedOn: new Date(),
        status: 'pending',
        dateAdded: new Date(),
      };

      useMemberStore.setState({ members: [initialMember] });

      const { storage } = await import('../../extension/src/services/storage');
      vi.mocked(storage.updateMember).mockResolvedValue(undefined);

      const { result } = renderHook(() => useMemberStore());

      await act(async () => {
        await result.current.updateMember('1', { status: 'approved' });
      });

      expect(result.current.members[0].status).toBe('approved');
    });
  });

  describe('removeMember', () => {
    it('should remove a member', async () => {
      const member1: MemberRequest = {
        id: '1',
        groupName: 'Test Group',
        userId: 'user1',
        facebookUsername: 'johndoe',
        joinedOn: new Date(),
        status: 'pending',
        dateAdded: new Date(),
      };
      const member2: MemberRequest = {
        id: '2',
        groupName: 'Test Group',
        userId: 'user2',
        facebookUsername: 'janedoe',
        joinedOn: new Date(),
        status: 'pending',
        dateAdded: new Date(),
      };

      useMemberStore.setState({ members: [member1, member2] });

      const { storage } = await import('../../extension/src/services/storage');
      vi.mocked(storage.removeMember).mockResolvedValue(undefined);

      const { result } = renderHook(() => useMemberStore());

      await act(async () => {
        await result.current.removeMember('1');
      });

      expect(result.current.members).toHaveLength(1);
      expect(result.current.members[0].id).toBe('2');
    });
  });

  describe('clearMembers', () => {
    it('should clear all members', async () => {
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

      useMemberStore.setState({ members: mockMembers });

      const { storage } = await import('../../extension/src/services/storage');
      vi.mocked(storage.setMembers).mockResolvedValue(undefined);

      const { result } = renderHook(() => useMemberStore());

      await act(async () => {
        await result.current.clearMembers();
      });

      expect(result.current.members).toEqual([]);
    });
  });

  describe('setSelectedGroup', () => {
    it('should set selected group', () => {
      const { result } = renderHook(() => useMemberStore());

      act(() => {
        result.current.setSelectedGroup('group123');
      });

      expect(result.current.selectedGroup).toBe('group123');
    });
  });
});
