import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet, Pressable,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { COLORS, FONT_SIZE } from '../../src/constants/colors';
import { useAuthStore } from '../../src/stores/authStore';
import { useChatStore } from '../../src/stores/chatStore';
import { subscribeToMessages, sendMessage, markChatRead } from '../../src/services/ChatService';
import { useRequireAuth } from '../../src/hooks/useAuth';
import type { Message } from '../../src/types';
import * as Haptics from 'expo-haptics';

interface DisplayMessage extends Message {
  /** When true, the message failed to send and the user can tap to retry. */
  failed?: boolean;
  /** Local-only flag — set while a retry or first attempt is in progress. */
  retrying?: boolean;
}

function MessageBubble({
  msg,
  isMe,
  onRetry,
}: {
  msg: DisplayMessage;
  isMe: boolean;
  onRetry?: () => void;
}) {
  const time = new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={[styles.bubbleRow, isMe && styles.bubbleRowMe]}>
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
        {!!msg.text && (
          <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{msg.text}</Text>
        )}
        <View style={styles.bubbleFooter}>
          <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>{time}</Text>
          {/* §12.4 — Failed message indicator with retry */}
          {msg.failed && !msg.retrying && (
            <Pressable onPress={onRetry} hitSlop={8} style={styles.retryRow}>
              <Ionicons name="alert-circle" size={14} color={COLORS.ERROR_RED} />
              <Text style={styles.retryText}>Tap to retry</Text>
            </Pressable>
          )}
          {msg.retrying && (
            <ActivityIndicator size={12} color={COLORS.TEXT_MUTED} style={{ marginLeft: 6 }} />
          )}
        </View>
      </View>
    </View>
  );
}

export default function ChatDetailScreen() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const insets = useSafeAreaInsets();
  const { user, canAccess, isLoading: authLoading } = useRequireAuth(chatId ? `/chat/${chatId}` : '/chat');
  const chats = useChatStore(s => s.chats);

  // Resolve chat metadata (other user name + ad title) from the chat store
  const chatPreview = chatId ? chats.find(c => c.id === chatId) : null;
  const headerTitle = chatPreview?.otherUserName ?? 'Chat';
  const headerSubtitle = chatPreview?.adTitle ?? '';

  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [failedMessages, setFailedMessages] = useState<DisplayMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chatId || !user) return;
    markChatRead(chatId, user.id);
    const unsub = subscribeToMessages(chatId, (msgs) => {
      setMessages(msgs);
      setLoading(false);
      // Remove from failedMessages any that have now appeared in the real stream
      setFailedMessages((prev) => {
        if (prev.length === 0) return prev;
        const realIds = new Set(msgs.map((m) => m.id));
        const remaining = prev.filter((fm) => !realIds.has(fm.id));
        return remaining.length === prev.length ? prev : remaining;
      });
    });
    return unsub;
  }, [chatId, user?.id]);

  // Merge real messages + any pending failed messages for display
  const displayMessages: DisplayMessage[] = [
    ...failedMessages,
    ...messages,
  ];

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || !chatId || !user) return;
    const text = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await sendMessage(chatId, user.id, text);
    } catch {
      // §12.4: Show red error icon next to message. Keep in UI. Tap to retry.
      const failedMsg: DisplayMessage = {
        id: `failed_${Date.now()}`,
        senderId: user.id,
        text,
        image: null,
        createdAt: Date.now(),
        failed: true,
      };
      setFailedMessages((prev) => [failedMsg, ...prev]);
    } finally {
      setSending(false);
    }
  }, [inputText, chatId, user]);

  const handleRetry = useCallback(async (failedMsg: DisplayMessage) => {
    if (!chatId || !user) return;

    // Mark as retrying
    setFailedMessages((prev) =>
      prev.map((m) => (m.id === failedMsg.id ? { ...m, retrying: true, failed: false } : m))
    );

    try {
      await sendMessage(chatId, user.id, failedMsg.text ?? '');
      // Remove from failed list on success
      setFailedMessages((prev) => prev.filter((m) => m.id !== failedMsg.id));
    } catch {
      // Still failed — re-mark as failed
      setFailedMessages((prev) =>
        prev.map((m) => (m.id === failedMsg.id ? { ...m, retrying: false, failed: true } : m))
      );
    }
  }, [chatId, user]);

  if (authLoading || !canAccess || !user) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.ACCENT} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={COLORS.TEXT_DARK} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{headerTitle}</Text>
          {!!headerSubtitle && (
            <Text style={styles.headerSubtitle} numberOfLines={1}>{headerSubtitle}</Text>
          )}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.ACCENT} />
        </View>
      ) : (
        <FlatList
          data={displayMessages}
          inverted
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble
              msg={item}
              isMe={item.senderId === user.id}
              onRetry={item.failed ? () => handleRetry(item) : undefined}
            />
          )}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Ionicons name="chatbubble-ellipses-outline" size={48} color={COLORS.TEXT_MUTED} />
              <Text style={styles.emptyText}>Start the conversation</Text>
            </View>
          }
        />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor={COLORS.TEXT_MUTED}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={2000}
            />
          </View>
          <Pressable
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
            style={({ pressed }) => [
              styles.sendBtn,
              (!inputText.trim()) && styles.sendBtnDisabled,
              pressed && { opacity: 0.8 },
            ]}
          >
            <Ionicons name="send" size={20} color={COLORS.TEXT_ON_ACCENT} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG_SCREEN },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12, backgroundColor: COLORS.BG_CARD,
    borderBottomWidth: 1, borderBottomColor: COLORS.BORDER,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: FONT_SIZE.LG, fontWeight: '700', color: COLORS.TEXT_DARK },
  headerSubtitle: { fontSize: FONT_SIZE.XS, color: COLORS.TEXT_MUTED, marginTop: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  messageList: { paddingHorizontal: 16, paddingVertical: 12, gap: 6 },
  emptyChat: { alignItems: 'center', gap: 8, paddingTop: 40, transform: [{ scaleY: -1 }] },
  emptyText: { fontSize: FONT_SIZE.MD, color: COLORS.TEXT_MUTED },
  bubbleRow: { flexDirection: 'row', marginBottom: 4 },
  bubbleRowMe: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '78%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, gap: 4 },
  bubbleMe: { backgroundColor: COLORS.CHAT_SENT_BG, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: COLORS.CHAT_RECEIVED_BG, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: FONT_SIZE.MD, color: COLORS.TEXT_DARK, lineHeight: 22 },
  bubbleTextMe: { color: COLORS.TEXT_ON_ACCENT },
  bubbleFooter: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', gap: 4 },
  bubbleTime: { fontSize: 10, color: COLORS.TEXT_MUTED },
  bubbleTimeMe: { color: 'rgba(255,255,255,0.7)' },
  retryRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 4 },
  retryText: { fontSize: 10, color: COLORS.ERROR_RED, fontWeight: '600' },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingTop: 10, backgroundColor: COLORS.BG_CARD,
    borderTopWidth: 1, borderTopColor: COLORS.BORDER,
  },
  inputWrap: {
    flex: 1, backgroundColor: COLORS.BG_SCREEN, borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 10, maxHeight: 120,
  },
  textInput: { fontSize: FONT_SIZE.MD, color: COLORS.TEXT_DARK, maxHeight: 100 },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.ACCENT,
    alignItems: 'center', justifyContent: 'center', marginBottom: 2,
  },
  sendBtnDisabled: { backgroundColor: COLORS.BG_DISABLED },
});
