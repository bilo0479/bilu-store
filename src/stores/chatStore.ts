import { create } from 'zustand';
import type { ChatPreview } from '../types';
import { subscribeToUserChats } from '../services/ChatService';

interface ChatState {
  chats: ChatPreview[];
  totalUnread: number;
  isLoading: boolean;
  setChats: (chats: ChatPreview[]) => void;
  subscribeToChats: (userId: string) => () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  chats: [],
  totalUnread: 0,
  isLoading: true,
  setChats: (chats) =>
    set({
      chats,
      totalUnread: chats.reduce((sum, c) => sum + c.unreadCount, 0),
      isLoading: false,
    }),
  subscribeToChats: (userId) => {
    set({ isLoading: true });
    return subscribeToUserChats(userId, (chats) => {
      set({
        chats,
        totalUnread: chats.reduce((sum, c) => sum + c.unreadCount, 0),
        isLoading: false,
      });
    });
  },
}));
