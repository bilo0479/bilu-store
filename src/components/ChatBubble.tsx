import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { COLORS, FONT_SIZE } from '../constants/colors';
import type { Message } from '../types';

interface ChatBubbleProps {
  message: Message;
  isMe: boolean;
}

/** Formats a timestamp to a short time string (e.g. "14:30"). */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Single chat message bubble.
 * Right-aligned for outgoing messages, left-aligned for incoming.
 */
export function ChatBubble({ message, isMe }: ChatBubbleProps) {
  return (
    <View style={[styles.row, isMe ? styles.rowMe : styles.rowOther]}>
      <View
        style={[
          styles.bubble,
          isMe ? styles.bubbleMe : styles.bubbleOther,
        ]}
      >
        {/* Image attachment */}
        {message.image && (
          <Image
            source={{ uri: message.image }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        )}
        {/* Text content */}
        {message.text && (
          <Text style={isMe ? styles.textMe : styles.textOther}>
            {message.text}
          </Text>
        )}
      </View>
      {/* Timestamp */}
      <Text style={[styles.time, isMe ? styles.timeMe : styles.timeOther]}>
        {formatTime(message.createdAt)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginVertical: 3,
    paddingHorizontal: 12,
    maxWidth: '80%',
  },
  rowMe: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  rowOther: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    overflow: 'hidden',
  },
  bubbleMe: {
    backgroundColor: COLORS.CHAT_SENT_BG,
    borderRadius: 18,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: COLORS.CHAT_RECEIVED_BG,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
  },
  textMe: {
    fontSize: FONT_SIZE.MD,
    color: COLORS.TEXT_ON_ACCENT,
    lineHeight: 20,
  },
  textOther: {
    fontSize: FONT_SIZE.MD,
    color: COLORS.TEXT_DARK,
    lineHeight: 20,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 4,
  },
  time: {
    fontSize: FONT_SIZE.XS,
    color: COLORS.TEXT_MUTED,
    marginTop: 3,
  },
  timeMe: {
    marginRight: 4,
  },
  timeOther: {
    marginLeft: 4,
  },
});
