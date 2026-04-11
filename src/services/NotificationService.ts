import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { doc, updateDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuthStore } from '../stores/authStore';
import { router } from 'expo-router';
import type { NotificationType } from '../types';

interface NotificationPayload {
  type: NotificationType;
  chatId?: string;
  adId?: string;
  sellerId?: string;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestPermission(): Promise<boolean> {
  if (!Device.isDevice) return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus === 'granted' && Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6B35',
    });
  }

  return finalStatus === 'granted';
}

export async function registerToken(): Promise<void> {
  const granted = await requestPermission();
  if (!granted) return;

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
  });

  const user = useAuthStore.getState().user;
  if (user && db) {
    await updateDoc(doc(db, 'users', user.id), { pushToken: token.data });
  }
}

const NOTIFICATION_ROUTES: Record<NotificationType, (p: NotificationPayload) => string | null> = {
  NEW_MESSAGE: (p) => p.chatId ? `/chat/${p.chatId}` : null,
  AD_APPROVED: (p) => p.adId ? `/ad/${p.adId}` : null,
  AD_REJECTED: () => '/my-ads',
  AD_INTEREST: (p) => p.chatId ? `/chat/${p.chatId}` : null,
  PREMIUM_EXPIRING: (p) => p.adId ? `/premium/${p.adId}` : null,
  NEW_REVIEW: (p) => p.sellerId ? `/seller/${p.sellerId}` : null,
};

export function getNotificationRoute(payload: NotificationPayload): string | null {
  return NOTIFICATION_ROUTES[payload.type]?.(payload) ?? null;
}

export function setupNotificationListeners(): () => void {
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const data = response.notification.request.content.data as NotificationPayload | undefined;
      if (data) {
        const route = getNotificationRoute(data);
        if (route) router.push(route as never);
      }
    }
  );

  const receivedSubscription = Notifications.addNotificationReceivedListener(() => {
    // Shown via the handler above. Additional in-app refresh can be added here.
  });

  return () => {
    responseSubscription.remove();
    receivedSubscription.remove();
  };
}

export function subscribeToBadgeCount(callback: (count: number) => void): () => void {
  const user = useAuthStore.getState().user;
  if (!user || !db) {
    callback(0);
    return () => {};
  }

  const q = query(collection(db, 'chats'), where('participants', 'array-contains', user.id));

  return onSnapshot(q, (snapshot) => {
    let total = 0;
    snapshot.forEach((docSnap) => {
      const unreadMap = (docSnap.data().unreadCount ?? {}) as Record<string, number>;
      total += unreadMap[user.id] ?? 0;
    });
    Notifications.setBadgeCountAsync(total).catch(() => {});
    callback(total);
  }, () => callback(0));
}
