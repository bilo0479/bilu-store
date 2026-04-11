import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE } from '../constants/colors';
import type { ChatPreview } from '../types';

interface ChatListItemProps {
  chat: ChatPreview;
  onPress: () => void;
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(timestamp).toLocaleDateString();
}

export function ChatListItem({ chat, onPress }: ChatListItemProps) {
  const hasUnread = chat.unreadCount > 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {chat.otherUserAvatar ? (
        <Image source={{ uri: chat.otherUserAvatar }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarFallback}>
          <Ionicons name="person" size={22} color={COLORS.TEXT_MUTED} />
        </View>
      )}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={[styles.name, hasUnread && styles.nameBold]} numberOfLines={1}>
            {chat.otherUserName}
          </Text>
          <Text style={[styles.time, hasUnread && styles.timeBold]}>
            {formatTimeAgo(chat.lastMessageAt)}
          </Text>
        </View>
        <View style={styles.bottomRow}>
          <Text
            style={[styles.message, hasUnread && styles.messageBold]}
            numberOfLines={1}
          >
            {chat.lastMessage || 'No messages yet'}
          </Text>
          {hasUnread && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.adTitle} numberOfLines={1}>
          {chat.adTitle}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    backgroundColor: COLORS.BG_CARD,
  },
  pressed: { backgroundColor: COLORS.DIVIDER },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.DIVIDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 3,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: FONT_SIZE.MD,
    fontWeight: '500',
    color: COLORS.TEXT_DARK,
    flex: 1,
  },
  nameBold: { fontWeight: '700' },
  time: {
    fontSize: FONT_SIZE.XS,
    color: COLORS.TEXT_MUTED,
  },
  timeBold: { color: COLORS.ACCENT },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  message: {
    fontSize: FONT_SIZE.SM,
    color: COLORS.TEXT_MUTED,
    flex: 1,
  },
  messageBold: { color: COLORS.TEXT_DARK, fontWeight: '600' },
  badge: {
    backgroundColor: COLORS.ACCENT,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.TEXT_ON_ACCENT,
  },
  adTitle: {
    fontSize: FONT_SIZE.XS,
    color: COLORS.TEXT_MUTED,
    fontStyle: 'italic',
  },
});
