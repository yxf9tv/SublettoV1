import { supabase } from './supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface ChatParticipant {
  id: string;
  chat_id: string;
  user_id: string;
  created_at: string;
  profile?: {
    id: string;
    name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
}

export interface Chat {
  id: string;
  listing_id: string;
  created_at: string;
  listing?: {
    id: string;
    title: string;
    images: { url: string }[];
  };
  participants?: ChatParticipant[];
  lastMessage?: Message;
}

export interface ChatWithDetails extends Chat {
  otherUser?: {
    id: string;
    name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
}

/**
 * Get all chats for a user with last message and other participant info
 */
export async function getUserChats(userId: string): Promise<ChatWithDetails[]> {
  // First, get all chat IDs where user is a participant
  const { data: participations, error: participationsError } = await supabase
    .from('chat_participants')
    .select('chat_id')
    .eq('user_id', userId);

  if (participationsError) {
    throw new Error(`Failed to fetch chats: ${participationsError.message}`);
  }

  if (!participations || participations.length === 0) {
    return [];
  }

  const chatIds = participations.map((p) => p.chat_id);

  // Fetch chats with listing info
  const { data: chats, error: chatsError } = await supabase
    .from('chats')
    .select(`
      *,
      listing:listings(id, title, listing_images(url))
    `)
    .in('id', chatIds)
    .order('created_at', { ascending: false });

  if (chatsError) {
    throw new Error(`Failed to fetch chat details: ${chatsError.message}`);
  }

  if (!chats || chats.length === 0) {
    return [];
  }

  // Fetch all participants for these chats
  const { data: allParticipants, error: participantsError } = await supabase
    .from('chat_participants')
    .select(`
      *,
      profile:profiles(id, name, email, avatar_url)
    `)
    .in('chat_id', chatIds);

  if (participantsError) {
    console.warn('Failed to fetch participants:', participantsError.message);
  }

  // Fetch last message for each chat
  const { data: lastMessages, error: messagesError } = await supabase
    .from('messages')
    .select('*')
    .in('chat_id', chatIds)
    .order('created_at', { ascending: false });

  if (messagesError) {
    console.warn('Failed to fetch last messages:', messagesError.message);
  }

  // Build chat details
  const chatsWithDetails: ChatWithDetails[] = chats.map((chat) => {
    const participants = (allParticipants || []).filter(
      (p) => p.chat_id === chat.id
    );
    const otherParticipant = participants.find((p) => p.user_id !== userId);
    const chatMessages = (lastMessages || []).filter(
      (m) => m.chat_id === chat.id
    );
    const lastMessage = chatMessages.length > 0 ? chatMessages[0] : undefined;

    return {
      id: chat.id,
      listing_id: chat.listing_id,
      created_at: chat.created_at,
      listing: chat.listing
        ? {
            id: chat.listing.id,
            title: chat.listing.title,
            images: chat.listing.listing_images || [],
          }
        : undefined,
      participants,
      lastMessage,
      otherUser: otherParticipant?.profile
        ? {
            id: otherParticipant.profile.id,
            name: otherParticipant.profile.name,
            email: otherParticipant.profile.email,
            avatar_url: otherParticipant.profile.avatar_url,
          }
        : undefined,
    };
  });

  // Sort by last message time
  return chatsWithDetails.sort((a, b) => {
    const aTime = a.lastMessage?.created_at || a.created_at;
    const bTime = b.lastMessage?.created_at || b.created_at;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });
}

/**
 * Get messages for a specific chat
 */
export async function getChatMessages(chatId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch messages: ${error.message}`);
  }

  return data || [];
}

/**
 * Send a message to a chat
 */
export async function sendMessage(
  chatId: string,
  senderId: string,
  content: string
): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      chat_id: chatId,
      sender_id: senderId,
      content,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to send message: ${error.message}`);
  }

  return data;
}

/**
 * Get or create a chat between two users for a listing
 */
export async function getOrCreateChat(
  listingId: string,
  userId1: string,
  userId2: string
): Promise<string> {
  // Check if a chat already exists for this listing with both participants
  const { data: existingChats, error: searchError } = await supabase
    .from('chats')
    .select(`
      id,
      chat_participants(user_id)
    `)
    .eq('listing_id', listingId);

  if (searchError) {
    throw new Error(`Failed to search for existing chat: ${searchError.message}`);
  }

  // Find a chat that has both users as participants
  const existingChat = existingChats?.find((chat) => {
    const participantIds = chat.chat_participants.map((p: any) => p.user_id);
    return participantIds.includes(userId1) && participantIds.includes(userId2);
  });

  if (existingChat) {
    return existingChat.id;
  }

  // Create new chat
  const { data: newChat, error: chatError } = await supabase
    .from('chats')
    .insert({ listing_id: listingId })
    .select()
    .single();

  if (chatError) {
    throw new Error(`Failed to create chat: ${chatError.message}`);
  }

  // Add participants
  const { error: participantsError } = await supabase
    .from('chat_participants')
    .insert([
      { chat_id: newChat.id, user_id: userId1 },
      { chat_id: newChat.id, user_id: userId2 },
    ]);

  if (participantsError) {
    throw new Error(`Failed to add chat participants: ${participantsError.message}`);
  }

  return newChat.id;
}

/**
 * Subscribe to new messages in a chat (real-time)
 */
export function subscribeToMessages(
  chatId: string,
  onMessage: (message: Message) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`messages:${chatId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`,
      },
      (payload) => {
        onMessage(payload.new as Message);
      }
    )
    .subscribe();

  return channel;
}

/**
 * Unsubscribe from messages channel
 */
export function unsubscribeFromMessages(channel: RealtimeChannel): void {
  supabase.removeChannel(channel);
}

/**
 * Get chat details by ID
 */
export async function getChatById(
  chatId: string,
  currentUserId: string
): Promise<ChatWithDetails | null> {
  const { data: chat, error: chatError } = await supabase
    .from('chats')
    .select(`
      *,
      listing:listings(id, title, user_id, listing_images(url))
    `)
    .eq('id', chatId)
    .single();

  if (chatError) {
    throw new Error(`Failed to fetch chat: ${chatError.message}`);
  }

  if (!chat) {
    return null;
  }

  // Fetch participants
  const { data: participants, error: participantsError } = await supabase
    .from('chat_participants')
    .select(`
      *,
      profile:profiles(id, name, email, avatar_url)
    `)
    .eq('chat_id', chatId);

  if (participantsError) {
    console.warn('Failed to fetch participants:', participantsError.message);
  }

  const otherParticipant = (participants || []).find(
    (p) => p.user_id !== currentUserId
  );

  return {
    id: chat.id,
    listing_id: chat.listing_id,
    created_at: chat.created_at,
    listing: chat.listing
      ? {
          id: chat.listing.id,
          title: chat.listing.title,
          images: chat.listing.listing_images || [],
        }
      : undefined,
    participants: participants || [],
    otherUser: otherParticipant?.profile
      ? {
          id: otherParticipant.profile.id,
          name: otherParticipant.profile.name,
          email: otherParticipant.profile.email,
          avatar_url: otherParticipant.profile.avatar_url,
        }
      : undefined,
  };
}



