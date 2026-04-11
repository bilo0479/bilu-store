import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  query, where, orderBy, limit, onSnapshot, Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { ChatPreview, Message } from '../types';
import * as crypto from 'expo-crypto';

export function subscribeToUserChats(
  userId: string,
  onData: (chats: ChatPreview[]) => void
): () => void {
  if (!db) { onData([]); return () => {}; }

  const q = query(
    collection(db, 'chats'),
    where('participants', 'array-contains', userId),
    orderBy('lastMessageAt', 'desc')
  );

  return onSnapshot(q, (snap) => {
    const chats: ChatPreview[] = snap.docs.map((d) => {
      const data = d.data();
      const participants = (data.participantDetails ?? {}) as Record<string, { name: string; avatar: string | null }>;
      const otherId = ((data.participants ?? []) as string[]).find((p: string) => p !== userId) ?? '';
      const other = participants[otherId] ?? { name: 'User', avatar: null };
      const unreadMap = (data.unreadCount ?? {}) as Record<string, number>;
      return {
        id: d.id,
        otherUserId: otherId,
        otherUserName: other.name,
        otherUserAvatar: other.avatar,
        adId: data.adId ?? '',
        adTitle: data.adTitle ?? '',
        adThumbnail: data.adThumbnail ?? '',
        lastMessage: data.lastMessage ?? '',
        lastMessageAt: data.lastMessageAt?.toMillis?.() ?? data.lastMessageAt ?? Date.now(),
        unreadCount: unreadMap[userId] ?? 0,
      };
    });
    onData(chats);
  });
}

export function subscribeToMessages(
  chatId: string,
  onData: (messages: Message[]) => void
): () => void {
  if (!db) { onData([]); return () => {}; }

  const q = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('createdAt', 'desc'),
    limit(100)
  );

  return onSnapshot(q, (snap) => {
    const messages: Message[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        senderId: data.senderId ?? '',
        text: data.text ?? null,
        image: data.image ?? null,
        createdAt: data.createdAt?.toMillis?.() ?? data.createdAt ?? Date.now(),
      };
    });
    onData(messages);
  });
}

export async function sendMessage(
  chatId: string,
  senderId: string,
  text: string,
  image?: string
): Promise<void> {
  if (!db) return;

  const msgId = crypto.randomUUID();
  const now = Timestamp.fromMillis(Date.now());

  await setDoc(doc(db, 'chats', chatId, 'messages', msgId), {
    senderId,
    text: text || null,
    image: image ?? null,
    createdAt: now,
  });

  // Update chat summary and bump unread for the other participant
  const chatDoc = await getDoc(doc(db, 'chats', chatId));
  if (chatDoc.exists()) {
    const data = chatDoc.data();
    const participants = (data.participants ?? []) as string[];
    const otherId = participants.find((p: string) => p !== senderId) ?? '';
    const unreadMap = (data.unreadCount ?? {}) as Record<string, number>;
    unreadMap[otherId] = (unreadMap[otherId] ?? 0) + 1;

    await updateDoc(doc(db, 'chats', chatId), {
      lastMessage: text || '[Image]',
      lastMessageAt: now,
      unreadCount: unreadMap,
    });
  }
}

function buildChatId(userA: string, userB: string, adId: string): string {
  const sorted = [userA, userB].sort();
  return `${sorted[0]}_${sorted[1]}_${adId}`;
}

export async function getOrCreateChat(
  currentUserId: string,
  currentUserName: string,
  currentUserAvatar: string | null,
  otherUserId: string,
  otherUserName: string,
  otherUserAvatar: string | null,
  adId: string,
  adTitle: string,
  adThumbnail: string,
  sellerId?: string
): Promise<string> {
  if (!db) throw new Error('Firebase is not configured');

  const chatId = buildChatId(currentUserId, otherUserId, adId);
  const chatSnap = await getDoc(doc(db, 'chats', chatId));
  if (chatSnap.exists()) return chatId;

  // sellerId is the ad owner — used by Cloud Functions for AD_INTEREST notifications
  const resolvedSellerId = sellerId ?? otherUserId;

  await setDoc(doc(db, 'chats', chatId), {
    participants: [currentUserId, otherUserId],
    participantDetails: {
      [currentUserId]: { name: currentUserName, avatar: currentUserAvatar },
      [otherUserId]: { name: otherUserName, avatar: otherUserAvatar },
    },
    adId,
    adTitle,
    adThumbnail,
    sellerId: resolvedSellerId,
    lastMessage: '',
    lastMessageAt: Timestamp.fromMillis(Date.now()),
    unreadCount: { [currentUserId]: 0, [otherUserId]: 0 },
    deletedFor: [],
  });
  return chatId;
}

export async function markChatRead(chatId: string, userId: string): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, 'chats', chatId), { [`unreadCount.${userId}`]: 0 });
}

export async function sendImage(chatId: string, senderId: string, imageUri: string): Promise<void> {
  await sendMessage(chatId, senderId, '', imageUri);
}

// Soft-delete for one participant. When both delete, chat is hidden from all.
export async function deleteChat(chatId: string, userId: string): Promise<void> {
  if (!db) return;

  const chatSnap = await getDoc(doc(db, 'chats', chatId));
  if (!chatSnap.exists()) return;

  const deletedFor = (chatSnap.data().deletedFor as string[]) ?? [];
  if (!deletedFor.includes(userId)) {
    deletedFor.push(userId);
    await updateDoc(doc(db, 'chats', chatId), { deletedFor });
  }
}
