import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { getUserChats, ChatWithDetails } from '../lib/messagesApi';
import { colors } from '../theme';

type RootStackParamList = {
  MainTabs: undefined;
  Chat: { chatId: string };
  ListingDetail: { listingId: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function MessagesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuthStore();

  const [chats, setChats] = useState<ChatWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadChats = useCallback(async () => {
    if (!user?.id) return;

    try {
      const userChats = await getUserChats(user.id);
      setChats(userChats);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadChats();
    }, [loadChats])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadChats();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderChatItem = ({ item }: { item: ChatWithDetails }) => {
    const listingImage =
      item.listing?.images && item.listing.images.length > 0
        ? item.listing.images[0].url
        : null;

    const otherUserName = item.otherUser?.name || item.otherUser?.email || 'User';
    const lastMessagePreview = item.lastMessage?.content || 'No messages yet';
    const lastMessageTime = item.lastMessage?.created_at || item.created_at;
    const isOwnMessage = item.lastMessage?.sender_id === user?.id;

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => navigation.navigate('Chat', { chatId: item.id })}
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {item.otherUser?.avatar_url ? (
            <Image
              source={{ uri: item.otherUser.avatar_url }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>
                {getInitials(otherUserName)}
              </Text>
            </View>
          )}
        </View>

        {/* Chat Info */}
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName} numberOfLines={1}>
              {otherUserName}
            </Text>
            <Text style={styles.chatTime}>{formatTime(lastMessageTime)}</Text>
          </View>

          <Text style={styles.listingTitle} numberOfLines={1}>
            {item.listing?.title || 'Unknown Listing'}
          </Text>

          <Text style={styles.lastMessage} numberOfLines={1}>
            {isOwnMessage ? 'You: ' : ''}
            {lastMessagePreview}
          </Text>
        </View>

        {/* Listing Thumbnail */}
        {listingImage && (
          <Image source={{ uri: listingImage }} style={styles.listingThumbnail} />
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No messages yet</Text>
      <Text style={styles.emptySubtitle}>
        Start a conversation by messaging a lister from their listing page
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
        </View>

        {/* Chat List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accentBlue} />
          </View>
        ) : (
          <FlatList
            data={chats}
            renderItem={renderChatItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.listContent,
              chats.length === 0 && styles.listContentEmpty,
            ]}
            ListEmptyComponent={renderEmptyState}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  listContentEmpty: {
    flex: 1,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.accentBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  chatInfo: {
    flex: 1,
    marginRight: 12,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  chatTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  listingTitle: {
    fontSize: 12,
    color: colors.accentBlue,
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#6B7280',
  },
  listingThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
