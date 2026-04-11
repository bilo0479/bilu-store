import { useState, useEffect } from 'react';
import { subscribeToMessages, markChatRead } from '../services/ChatService';
import { useAuthStore } from '../stores/authStore';
import type { Message } from '../types';

export function useChat(chatId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!chatId || !user) return;

    setIsLoading(true);
    const unsubscribe = subscribeToMessages(chatId, (msgs) => {
      setMessages(msgs);
      setIsLoading(false);
      markChatRead(chatId, user.id).catch(() => {});
    });

    return () => unsubscribe();
  }, [chatId, user]);

  return { messages, isLoading };
}
