/**
 * ChatService — P3 Convex migration
 *
 * Chat state is now fully managed by Convex reactive queries.
 * This module provides imperative helpers used by screens that need
 * one-shot calls (e.g. createConversation on first message).
 *
 * Reactive subscriptions:
 *   - useQuery(api.chat.listConversations)          → chat tab
 *   - useQuery(api.chat.listMessages, { conversationId }) → chat screen
 *
 * Mutations (called via useMutation):
 *   - api.chat.createConversation
 *   - api.chat.sendMessage
 *   - api.chat.markRead
 */

export type { ChatPreview, Message } from '../types';

// Re-export the Convex API references so callers have a single import point.
// The actual hooks (useQuery / useMutation) are used directly in components.
export { api } from '../../convex/_generated/api';
