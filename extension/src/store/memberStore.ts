import { create } from 'zustand';
import { storage } from '@/services/storage';
import type { MemberRequest } from '@/shared/types';

interface MemberState {
  members: MemberRequest[];
  isLoading: boolean;
  selectedGroup: string | null;

  // Actions
  loadMembers: () => Promise<void>;
  addMember: (member: MemberRequest) => Promise<void>;
  updateMember: (memberId: string, updates: Partial<MemberRequest>) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  clearMembers: () => Promise<void>;
  setSelectedGroup: (groupId: string) => void;
}

export const useMemberStore = create<MemberState>((set, get) => ({
  members: [],
  isLoading: true,
  selectedGroup: null,

  loadMembers: async () => {
    try {
      set({ isLoading: true });
      const members = await storage.getMembers();
      set({ members, isLoading: false });
    } catch (error) {
      console.error('Error loading members:', error);
      set({ isLoading: false });
    }
  },

  addMember: async (member: MemberRequest) => {
    try {
      await storage.addMember(member);
      const members = get().members;
      set({ members: [...members, member] });
    } catch (error) {
      console.error('Error adding member:', error);
      throw error;
    }
  },

  updateMember: async (memberId: string, updates: Partial<MemberRequest>) => {
    try {
      await storage.updateMember(memberId, updates);
      const members = get().members;
      const updatedMembers = members.map(m =>
        m.id === memberId ? { ...m, ...updates } : m
      );
      set({ members: updatedMembers });
    } catch (error) {
      console.error('Error updating member:', error);
      throw error;
    }
  },

  removeMember: async (memberId: string) => {
    try {
      await storage.removeMember(memberId);
      const members = get().members;
      set({ members: members.filter(m => m.id !== memberId) });
    } catch (error) {
      console.error('Error removing member:', error);
      throw error;
    }
  },

  clearMembers: async () => {
    try {
      await storage.setMembers([]);
      set({ members: [] });
    } catch (error) {
      console.error('Error clearing members:', error);
      throw error;
    }
  },

  setSelectedGroup: (groupId: string) => {
    set({ selectedGroup: groupId });
  },
}));
