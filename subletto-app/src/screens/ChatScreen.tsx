import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import {
  getChatById,
  getChatMessages,
  sendMessage,
  subscribeToMessages,
  unsubscribeFromMessages,
  Message,
  ChatWithDetails,
} from '../lib/messagesApi';
import { colors } from '../theme';
import { RealtimeChannel } from '@supabase/supabase-js';

type RootStackParamList = {
  MainTabs: undefined;
  Chat: { chatId: string };
  ListingDetail: { listingId: string };
};

type ChatRouteProp = RouteProp<RootStackParamList, 'Chat'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ChatScreen() {
  const route = useRoute<ChatRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuthStore();
  const { chatId } = route.params;

  const [chat, setChat] = useState<ChatWithDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const loadChat = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Load chat details
      const chatDetails = await getChatById(chatId, user.id);
      setChat(chatDetails);

      // Load messages
      const chatMessages = await getChatMessages(chatId);
      setMessages(chatMessages);
    } catch (error) {
      console.error('Error loading chat:', error);
    } finally {
      setLoading(false);
    }
  }, [chatId, user?.id]);

  useEffect(() => {
    loadChat();

    // Subscribe to real-time messages
    channelRef.current = subscribeToMessages(chatId, (newMsg) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m.id === newMsg.id)) {
          return prev;
        }
        return [...prev, newMsg];
      });
    });

    return () => {
      if (channelRef.current) {
        unsubscribeFromMessages(channelRef.current);
      }
    };
  }, [chatId, loadChat]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user?.id || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const sentMessage = await sendMessage(chatId, user.id, messageContent);
      // Message will be added via real-time subscription
      // But add it immediately for better UX
      setMessages((prev) => {
        if (prev.some((m) => m.id === sentMessage.id)) {
          return prev;
        }
        return [...prev, sentMessage];
      });
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageContent); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const shouldShowDateHeader = (index: number) => {
    if (index === 0) return true;
    const currentDate = new Date(messages[index].created_at).toDateString();
    const prevDate = new Date(messages[index - 1].created_at).toDateString();
    return currentDate !== prevDate;
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwnMessage = item.sender_id === user?.id;
    const showDateHeader = shouldShowDateHeader(index);

    return (
      <View>
        {showDateHeader && (
          <View style={styles.dateHeader}>
            <Text style={styles.dateHeaderText}>
              {formatDate(item.created_at)}
            </Text>
          </View>
        )}
        <View
          style={[
            styles.messageBubbleContainer,
            isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer,
          ]}
        >
          <View
            style={[
              styles.messageBubble,
              isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
              ]}
            >
              {item.content}
            </Text>
            <Text
              style={[
                styles.messageTime,
                isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime,
              ]}
            >
              {formatTime(item.created_at)}
            </Text>
          </View>
        </View>
      </View>
    );
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

  const otherUserName = chat?.otherUser?.name || chat?.otherUser?.email || 'User';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            {chat?.otherUser?.avatar_url ? (
              <Image
                source={{ uri: chat.otherUser.avatar_url }}
                style={styles.headerAvatar}
              />
            ) : (
              <View style={styles.headerAvatarPlaceholder}>
                <Text style={styles.headerAvatarInitials}>
                  {getInitials(otherUserName)}
                </Text>
              </View>
            )}
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerName} numberOfLines={1}>
                {otherUserName}
              </Text>
              {chat?.listing && (
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('ListingDetail', {
                      listingId: chat.listing!.id,
                    })
                  }
                >
                  <Text style={styles.headerListing} numberOfLines={1}>
                    {chat.listing.title}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.headerSpacer} />
        </View>

        {/* Messages */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accentBlue} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No messages yet. Say hello! 👋
                </Text>
              </View>
            }
          />
        )}

        {/* Composer */}
        <View style={styles.composerContainer}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor="#9CA3AF"
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={1000}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newMessage.trim() || sending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerAvatarInitials: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  headerListing: {
    fontSize: 12,
    color: colors.accentBlue,
    marginTop: 2,
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexGrow: 1,
  },
  dateHeader: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateHeaderText: {
    fontSize: 12,
    color: '#9CA3AF',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messageBubbleContainer: {
    marginBottom: 8,
    flexDirection: 'row',
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  ownMessageBubble: {
    backgroundColor: colors.accentBlue,
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: colors.textPrimary,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  otherMessageTime: {
    color: '#9CA3AF',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  composerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  inputContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    maxHeight: 100,
  },
  input: {
    fontSize: 15,
    color: colors.textPrimary,
    maxHeight: 80,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
});



