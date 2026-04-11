import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS, FONT_SIZE } from '../../src/constants/colors';
import { ChatListItem } from '../../src/components/ChatListItem';
import { EmptyState } from '../../src/components/EmptyState';
import { SkeletonChatList } from '../../src/components/Skeleton';
import { useAuthStore } from '../../src/stores/authStore';
import { useChatStore } from '../../src/stores/chatStore';
import { redirectToLogin } from '../../src/hooks/useAuth';

const CHAT_ITEM_HEIGHT = 80;

export default function ChatsScreen() {
  const insets = useSafeAreaInsets();
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const user = useAuthStore(s => s.user);
  const { chats, isLoading, subscribeToChats } = useChatStore();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      subscribeToChats(user.id);
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  }, [user, subscribeToChats]);

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <EmptyState
          icon="chatbubbles-outline"
          title="Sign in to chat"
          subtitle="Log in to message sellers and buyers"
          actionLabel="Sign In"
          onAction={() => void redirectToLogin('/(tabs)/chat')}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.title}>Messages</Text>
      </View>

      {isLoading && chats.length === 0 ? (
        <SkeletonChatList count={6} />
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
              <ChatListItem
                chat={item}
                onPress={() => router.push(`/chat/${item.id}` as never)}
              />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="chatbubbles-outline"
              title="No conversations yet"
              subtitle="Start chatting by contacting a seller on their ad"
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.ACCENT} />
          }
          getItemLayout={(data, index) => ({
            length: CHAT_ITEM_HEIGHT,
            offset: CHAT_ITEM_HEIGHT * index,
            index,
          })}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG_SCREEN,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: COLORS.BG_CARD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  title: {
    fontSize: FONT_SIZE.XL,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingBottom: 100,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.DIVIDER,
    marginLeft: 80,
  },
});
